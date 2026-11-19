import Link from 'next/link';
import type { ReactNode } from 'react';
import { unpackAnswers } from '@/lib/claims';
import { getClaimMessages, getClaimsQueue, getFinderMessages } from '@/lib/data';
import type { T } from '@/lib/i18n';
import type { ItemDetail } from '@/lib/types';
import { ClaimChat } from '@/components/ClaimChat';
import { FinderChat } from '@/components/FinderChat';
import { Icon } from '@/components/Icon';
import { ReceiveHere } from '@/components/ReceiveHere';
import { Kv, placeDate, when } from '@/components/ui';
import { DecideButtons, HandoverForm } from '../../desk/DeskActions';

type StepState = 'done' | 'now' | 'later';

function Step({ n, state, title, sub, children }: { n: number; state: StepState; title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <section className={'casestep ' + state}>
      <div className="casestep-head">
        <span className="casestep-n">{state === 'done' ? <Icon name="check" size={16} /> : n}</span>
        <div><b>{title}</b>{sub && <div className="meta">{sub}</div>}</div>
      </div>
      {state === 'now' && children && <div className="casestep-body">{children}</div>}
    </section>
  );
}

/**
 * Staff, found item: the whole case on one screen. Every step in order (done / now / later), and the controls for the
 * current step right here: confirm it reached the office (shelf), message the finder, verify claims, hand it over.
 */
export async function CasePanel({ it, orgId, shelves, idTypes, pickupCode = '', t }: { it: ItemDetail; orgId: number; shelves: string[]; idTypes: string[]; pickupCode?: string; t: T }) {
  const claims = (await getClaimsQueue(orgId)).filter(c => c.foundItemId === it.id);
  const pending = claims.filter(c => c.status === 'pending');
  const approved = claims.find(c => c.status === 'approved') ?? null;
  const atOffice = !!it.receivedAt;
  const returned = it.status === 5, closed = it.status === 6;
  const memberFinder = !atOffice && !!it.reporterId;
  const [msgs, fmsgs] = await Promise.all([getClaimMessages(claims.map(c => c.id)), memberFinder ? getFinderMessages([it.id]) : Promise.resolve({} as Awaited<ReturnType<typeof getFinderMessages>>)]);

  if (closed) return null; // the red "Closed" note on the page says it all

  const s1: StepState = atOffice || returned ? 'done' : 'now';
  const s2: StepState = approved || returned ? 'done' : pending.length ? 'now' : 'later';
  const s3: StepState = returned ? 'done' : approved && atOffice ? 'now' : 'later';
  const nothingToDo = s1 !== 'now' && s2 !== 'now' && s3 !== 'now';

  return (
    <div className="box casepanel" id="case">
      <h2 style={{ marginTop: 0 }}><Icon name="list" size={18} /> {t('What to do with this item')}</h2>

      <Step n={1} state={s1} title={t('Item at the office')}
        sub={atOffice ? t('Received {time} · shelf {shelf}', { time: when(it.receivedAt), shelf: it.shelf ?? '—' })
          : it.handedInAt ? t('The finder says they brought it ({time}).', { time: when(it.handedInAt) }) : t('The finder still has it.')}>
        {it.itemCode && (
          <div className="casecode"><span className="meta">{t('Item code (the finder can show it in the app)')}</span><b>{it.itemCode}</b></div>
        )}
        <ReceiveHere itemId={it.id} shelves={shelves} handedIn={!!it.handedInAt} />
        {memberFinder && (
          <FinderChat itemId={it.id} finderName={it.reporterName} handedIn={!!it.handedInAt} claimed={claims.length > 0}
            messages={fmsgs[it.id] ?? []} messagesHref={`/messages?with=${it.reporterId}`} />
        )}
      </Step>
      {/* A claim can be checked while the finder still has the item, so step 2 can be open at the same time as step 1. */}
      {s1 === 'now' && s2 === 'now' && <div className="casestep-also meta">{t('You can also do step 2 now:')}</div>}

      <Step n={2} state={s2} title={t('Check the owner')}
        sub={approved ? t('Approved: {name}', { name: approved.claimantName ?? '' }) : returned ? t('Done') : pending.length
          ? t('{n} claims waiting', { n: pending.length }) : t('Nobody has claimed it yet.')}>
        {pending.map(c => {
          const a = unpackAnswers(c.answers);
          return (
            <div key={c.id} className="caseclaim">
              <b>{t('claimed by {name}', { name: c.claimantName ?? '' })}</b> <span className="meta">· {when(c.createdAt)}</span>
              <div className="cols even" style={{ marginTop: 8 }}>
                <div>
                  <div className="sec-title">{t('What the claimant says')}</div>
                  <div style={{ whiteSpace: 'pre-line' }}>{a.details}</div>
                  <Kv label={t('Where and when did you lose it?')} value={(a.place || a.date) && <>{[a.place, a.date].filter(Boolean).join(' · ')}
                    <span className="meta"> ({t('Found')}: {placeDate(it.place, it.date, t)})</span></>} />
                  {c.lostDescription && <><div className="sec-title">{t('Their lost report')}</div><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{c.lostDescription}</p></>}
                </div>
                <div>
                  <div className="sec-title">{t('Private details of the found item')}</div>
                  <div className="hidden-note">
                    <div className="meta"><Icon name="shield" size={15} />{t('Only staff see this. Does the claimant describe it?')}</div>
                    <div style={{ whiteSpace: 'pre-line' }}>{it.description || t('No private details were recorded. Ask the claimant in person.')}</div>
                  </div>
                </div>
              </div>
              <DecideButtons id={c.id} />
              <ClaimChat claimId={c.id} messages={msgs[c.id] ?? []} viewer="staff" open messagesHref={`/messages?with=${c.claimantId}`} />
            </div>
          );
        })}
      </Step>

      <Step n={3} state={s3} title={t('Hand it to the owner')}
        sub={returned ? t('Returned to its owner.') : approved && !atOffice ? t('Waiting for the item to reach the office (step 1).')
          : approved ? t('The owner was told to come with the pickup code and a photo ID.') : t('After the owner is approved.')}>
        {approved && (
          <>
            <HandoverForm id={approved.id} hasCode ready={atOffice} itemId={it.id} idTypes={idTypes} initialCode={pickupCode} />
            <ClaimChat claimId={approved.id} messages={msgs[approved.id] ?? []} viewer="staff" open messagesHref={`/messages?with=${approved.claimantId}`} />
          </>
        )}
      </Step>

      {nothingToDo && !returned && (
        <p className="meta" style={{ margin: '12px 0 0' }}>
          <Icon name="clock" size={14} /> {t('Nothing to do right now. It stays on its shelf until the owner claims it.')}{' '}
          {it.itemCode && <Link href={`/label/${it.id}`}>{t('Print label')}</Link>}
        </p>
      )}
    </div>
  );
}
