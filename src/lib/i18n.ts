import type { Lang } from './types';

export type T = (key: string, vars?: Record<string, string | number>) => string;

// English text is the key. To edit Japanese, change the value on the right.
// {name}-style placeholders are filled in by t('...', {name: ...}).
const J: Record<string, string> = {
  // header, roles, menus
  'Lost & Found': '落とし物管理', 'Language / 言語': 'Language / 言語', 'Change language': '言語を切り替える', 'Log out': 'ログアウト',
  'Yokohama Demo School': '横浜デモ学園', 'Harbor Mart': 'ハーバーマート', 'Nexa Systems': 'ネクサシステムズ',
  'Member': '会員', 'Staff': 'スタッフ', 'Org admin': '組織管理者', 'Super admin': 'システム管理者',
  'My page': 'マイページ', 'Report an item': '落とし物を届ける', 'Found items': '拾得物一覧', 'Community': 'コミュニティ',
  'Work queue': '作業リスト', 'Scan item': 'アイテムをスキャン', 'Register found item': '拾得物を登録', 'Verify claims': '請求を確認',
  'Dashboard': 'ダッシュボード', 'Users': 'ユーザー', 'Settings': '設定', 'Organizations': '組織',

  // item steps, categories, places, organization types
  'Reported': '届出済み', 'Received at office': '事務所で受領', 'Matched': '一致', 'Verified': '確認済み', 'Returned': '返却済み',
  'Wallet': '財布', 'Bag': 'かばん', 'Electronics': '電子機器', 'ID card': '身分証', 'Keys': '鍵', 'Other': 'その他', 'All': 'すべて',
  'Library': '図書館', 'Gym': '体育館', 'Room 302': '302教室', 'Entrance': '入口', 'Cafeteria': '食堂',
  'School': '学校', 'Store': '店舗', 'Company': '会社',

  // login / sign up
  'Welcome to Lost & Found': '落とし物管理へようこそ', 'Login to manage your lost and found items.': 'ログインして落とし物を管理しましょう。',
  'Email': 'メールアドレス', 'Password': 'パスワード', 'Enter your email': 'メールアドレスを入力', 'Enter your password': 'パスワードを入力', 'Login': 'ログイン',
  "Don't have an account?": 'アカウントをお持ちでないですか？', 'Create Account': 'アカウント作成', 'Create your Lost & Found account.': '落とし物管理のアカウントを作成します。',
  'Name': '名前', 'Your name': 'お名前', 'At least 6 characters': '6文字以上', 'Confirm Password': 'パスワード（確認）', 'Enter password again': 'もう一度入力',
  'Already have an account?': 'すでにアカウントをお持ちですか？', 'Account created': 'アカウントを作成しました', 'Passwords do not match.': 'パスワードが一致しません。',

  // community
  'Find Your Community': '所属先を探す', 'Choose the school or organization you belong to.': '所属する学校・組織を選んでください。',
  'Request Membership': '参加を申請', 'Membership Request': '参加申請', 'Pending': '確認待ち', 'Refresh Status': '状態を更新',
  'Your request has been sent to the organization administrator.': '申請は組織の管理者に送信されました。',
  'Your community': 'あなたのコミュニティ', 'Other communities': '他のコミュニティ',
  'You stay in your current community until the new request is approved.': '新しい申請が承認されるまで、現在のコミュニティに所属したままです。',
  'Membership request sent': '参加申請を送信しました', 'Membership approved': '参加を承認しました', 'Membership request rejected': '参加申請を却下しました',

  // my page
  'Hello, {name}': 'こんにちは、{name}さん', '1 item in progress.': '進行中は1件です。', '{n} items in progress.': '進行中は{n}件です。',
  'Browse found items': '拾得物を見る',
  'Items are always returned at the office. Bring a photo ID to collect yours.': '返却は必ず事務所で行います。受け取りには顔写真付きの身分証をお持ちください。',
  'Items you reported': '届け出た件数', 'Possible match': '一致の可能性', 'Ready to thank': 'お礼を送れる件数', 'Your items': 'あなたのアイテム',
  'Possible match found': '一致の可能性が見つかりました', 'Request to claim': '請求を申請', 'You have not reported anything yet.': 'まだ何も届け出ていません。',
  'Your claims': 'あなたの請求', 'Approved — visit the office': '承認済み — 事務所へお越しください', 'Rejected': '却下',

  // report
  'Tell us what you lost or found.': 'なくしたもの、見つけたものを教えてください。', 'I lost something': 'なくしました', 'I found something': '見つけました',
  'Item name': 'アイテム名', 'e.g. Black wallet': '例：黒い財布', 'Category': 'カテゴリ', 'Date': '日付', 'Place': '場所',
  'Description': '説明', 'Color, size, marks': '色、大きさ、特徴', 'Photo': '写真', 'Submit report': '届出を送信',
  'Hand the item to the office': '物を事務所に預けてください',
  'Reporting here is not enough. Bring the item to the office so staff can store it and confirm the owner’s identity before returning it.': 'ここでの届出だけでは完了しません。物を事務所に持参してください。スタッフが保管し、返却前に持ち主の本人確認を行います。',
  'Keep it at the office': '事務所で保管してください',
  'Store the item at the office. To assign a shelf and print its label, use Register found item.': '物は事務所で保管します。棚の割り当てとラベル印刷は「拾得物を登録」から行ってください。',
  'Please enter the item name.': 'アイテム名を入力してください。', 'Report submitted': '届出を送信しました',
  'Reported. Now bring the item to the office': '届出が完了しました。次に事務所へお持ちください',

  // found items + claim
  'Items held at the front desk. Private details are hidden.': '受付で保管中の物です。個人情報は表示されません。', 'This is mine': '私のものです',
  'No items in this category yet. Check back later or report your item.': 'このカテゴリにはまだアイテムがありません。後で確認するか、届け出てください。',
  'Claim item': 'アイテムを請求', 'Answer these, then show ID at the office to collect it.': '質問に答え、事務所で身分証を見せて受け取ってください。',
  'What color is it? Any marks or stickers?': '何色ですか？ 目印やステッカーはありますか？',
  'Describe details only the owner would know': '持ち主だけが知っている特徴を書いてください',
  'Send claim': '請求を送る', 'Cancel': 'キャンセル', 'Claim sent to staff': '請求をスタッフに送信しました',

  // work queue
  'What needs attention today.': '今日対応が必要なこと。', 'Items to receive': '受領待ちの件数', 'Claims to verify': '確認待ちの請求',
  'New found items': '新しい拾得物', 'Reported by: {name}': '報告者：{name}', 'Not yet at office': 'まだ事務所に届いていません', 'Receive item': '受け取る',
  'Nothing waiting to be received right now.': '現在、受領待ちのアイテムはありません。', 'Claims waiting': '確認待ちの請求',
  'claimed by {name}': '申請者：{name}', 'Review': '確認する', 'No claims waiting right now.': '現在、確認待ちの請求はありません。',

  // register found item
  'Add the item and print its storage label.': 'アイテムを登録し、保管ラベルを発行します。',
  'Receiving an item reported by {name}': '{name}さんが届けたアイテムを受領します',
  'Check the details below, then add a shelf to finish.': '下の内容を確認し、棚を選んで完了してください。',
  'e.g. Green scarf': '例：緑のマフラー', 'Who found it': '発見者', 'A member handed it in': '会員が届けた', 'Staff or admin found it': 'スタッフ・管理者が発見',
  'Finder name (for thanks)': '発見者名（お礼用）', 'Optional': '任意', 'Found at': '発見場所', 'Found date': '発見日', 'Storage shelf': '保管棚',
  'The item stays at the office until the owner shows ID.': '持ち主が身分証を提示するまで、アイテムは事務所で保管されます。',
  'Register item': '登録する', 'Storage label': '保管ラベル', 'Attach this to the item.': 'アイテムに取り付けてください。',
  'Assigned automatically when you register the item.': '登録すると自動的に割り当てられます。',
  'Item registered · {code} · Shelf {shelf}': 'アイテムを登録しました · {code} · 棚 {shelf}',

  // verify claims + handover
  'Compare the claimant’s answers with what the item shows.': '申請者の回答を物の記録と照らし合わせます。', 'No claims yet.': 'まだ請求はありません。',
  '{item} · claimed by {name}': '{item} · 申請者：{name}', 'Approved': '承認済み', 'Claimant’s answers': '申請者の回答',
  'Their own lost report: {text}': '本人の届出内容：{text}', 'No linked lost report — compare in person': '関連する届出はありません — 対面で確認してください',
  'Approve': '承認', 'Reject': '却下する', 'Confirm ID and hand over': '本人確認して返却',
  'Claim approved. Owner must visit the office with ID': '請求を承認しました。持ち主は身分証を持って事務所へ', 'Claim rejected': '請求を却下しました',
  'Hand over item': 'アイテムを返却', 'Release the item only after checking ID in person.': '必ず対面で身分証を確認してから物を渡してください。',
  'ID shown by {name}': '{name}さんが提示した身分証',
  'Student ID': '学生証', 'Driver’s license': '運転免許証', 'My Number card': 'マイナンバーカード', 'Passport': 'パスポート',
  'Name on ID matches the claimant': '身分証の氏名が申請者と一致', 'Face matches the ID photo': '顔が身分証の写真と一致',
  'Check both boxes after verifying the ID.': '身分証を確認したら両方にチェックしてください。', 'Confirm handover': '返却を確定', 'Handover recorded': '返却を記録しました',

  // scan
  'Scan the QR label or type the item ID.': 'QRラベルをスキャンするか、アイテムIDを入力してください。', 'Item ID': 'アイテムID', 'Look up item': 'アイテムを検索',
  'Ready to scan': 'スキャン待ち',
  'Point a scanner at the QR label, or type the item ID below. The item’s page opens right away.': 'QRラベルをスキャンするか、下にアイテムIDを入力してください。すぐにアイテムのページが開きます。',
  'No item found': 'アイテムが見つかりません', 'Recent scans': '最近のスキャン', 'Time': '時刻', 'Item': 'アイテム', 'No scans yet today.': '本日のスキャンはまだありません。',
  'Enter an item ID first': '先にアイテムIDを入力してください', '{code} · Shelf {shelf}': '{code} · 棚 {shelf}', 'Found at: {place}': '発見場所：{place}',

  // dashboard (sample numbers)
  'How lost and found is going across the school.': '学校全体の落とし物の状況', 'Items this term': '今学期の件数', 'Returned to owners': '持ち主への返却率',
  'Average time to return': '返却までの平均日数', '{n} days': '{n}日', 'Waiting for owners': '持ち主待ち', 'Returns per month': '月ごとの返却数',
  'May': '5月', 'Jun': '6月', 'Jul': '7月', 'Aug': '8月', 'Sep': '9月',

  // users
  'Users & Membership Requests': 'ユーザーと参加申請', 'Manage people who want to join your organization.': '組織への参加を希望する人を管理します。',
  'Membership Requests': '参加申請', 'No pending requests.': '承認待ちの申請はありません。', 'Requesting: {org}': '申請先：{org}',
  'Accept': '承認する', 'Members': 'メンバー', 'Role': '役割',

  // settings (sample)
  'Rules for your organization.': '組織のルールを設定します。', 'Storage period': '保管期間', 'Days before unclaimed items expire': '請求のない物が期限切れになるまでの日数',
  'Thank-you points': 'お礼ポイント', 'Owners can thank finders after a return': '返却後、持ち主が拾った人にお礼を送れます',
  'Hide sensitive items from browsing': '重要な物を一覧に表示しない', 'Wallets, IDs, phones': '財布、身分証、スマートフォン',
  'Require ID at handover': '返却時に身分証を必須にする', 'Save changes': '変更を保存', 'Setting saved': '設定を保存しました', 'Settings saved': '設定を保存しました',

  // organizations (super admin, sample)
  'Every school, company and store using the service.': 'このサービスを利用するすべての学校・会社・店舗', 'Add organization': '組織を追加',
  'Type': '種類', 'Items': 'アイテム数', 'Status': '状態', 'Active': '有効', 'Suspended': '停止中', 'Organization created': '組織を作成しました',

  // menu groups and new menu items
  'Main': 'メイン', 'Home': 'ホーム', 'Lost & found': '落とし物', 'Pickup & thanks': '受け取り・お礼', 'Account': 'アカウント',
  'Front desk': '受付', 'Overview': '概要', 'Items & matching': 'アイテムと照合', 'Unclaimed items': '未請求のアイテム',
  'People': 'ユーザー管理', 'Insights & security': '分析とセキュリティ', 'Platform': 'プラットフォーム',
  'Notifications': '通知', 'My items': 'マイアイテム', 'Possible matches': '一致の候補', 'Map view': 'マップ',
  'Pickup pass': '受け取りパス', 'Return history': '返却履歴', 'Thanks & rewards': 'お礼とポイント', 'Messages': 'メッセージ',
  'Profile & privacy': 'プロフィールとプライバシー', 'How it works': '使い方', 'Handover': '返却手続き', 'Storage map': '保管棚マップ',
  'Alerts & to-do': 'アラートとやること', 'All items': 'すべてのアイテム', 'Match review': '照合の確認', 'Item history': 'アイテム履歴',
  'Expiry queue': '保管期限', 'Disposal records': '処分記録', 'Roles & permissions': '役割と権限', 'Staff activity': 'スタッフの活動',
  'Reports': 'レポート', 'Hotspot map': 'ホットスポット', 'Audit log': '監査ログ', 'Thank-you rules': 'お礼のルール',
  'Platform statistics': 'プラットフォーム統計', 'System audit': 'システム監査',

  // shared words
  'Lost': '紛失', 'Found': '拾得', 'Back': '戻る', 'Next': '次へ', 'Details': '詳細', 'Open': '開く', 'Search': '検索', 'Find': '探す',
  'Add': '追加', 'Remove': '削除', 'Send': '送信', 'Shelf': '棚', 'Item code': 'アイテムコード', 'Owner': '持ち主', 'Reported by': '報告者',
  'Action': '操作', 'By': '担当者', 'Target': '対象', 'Area': '分類', 'Organization': '組織', 'Points': 'ポイント', 'Rule': 'ルール',
  'High': '高', 'Medium': '中', 'Low': '低', 'Claims': '請求', 'Membership': 'メンバー', 'Unread': '未読', 'History': '履歴',
  'Export CSV': 'CSVを書き出す', 'CSV downloaded': 'CSVをダウンロードしました', 'Print / PDF': '印刷 / PDF', 'Campus map': '構内マップ',
  'Nothing here yet.': 'まだ何もありません。', 'Nothing to show.': '表示するものはありません。', 'No items yet.': 'まだアイテムはありません。',
  'you': 'あなた', 'Yesterday': '昨日', 'Last week': '先週', '2 days ago': '2日前',
  'Jan': '1月', 'Feb': '2月', 'Mar': '3月', 'Apr': '4月', 'Oct': '10月', 'Nov': '11月', 'Dec': '12月',

  // home
  'Action needed': '対応が必要', 'You are all caught up.': '対応が必要なことはありません。', 'Claim approved': '請求が承認されました',
  'Bring your photo ID to the office.': '顔写真付きの身分証を持って事務所へお越しください。', 'Open pickup pass': '受け取りパスを開く',
  'Check if this is your item.': 'あなたの物か確認してください。', 'Review match': '候補を確認', 'Say thanks': 'お礼を伝える',
  'Optional. Thank the person who found it.': '任意です。拾ってくれた人にお礼を伝えましょう。', 'Send thanks': 'お礼を送る',
  'See all my items': 'すべてのアイテムを見る', 'Returned this month': '今月の返却数', 'Community return rate': 'コミュニティの返却率',
  'Items you helped return': 'あなたが返却に協力した数', 'Recent activity': '最近のできごと', 'No activity yet.': 'まだできごとはありません。',
  'See all notifications': 'すべての通知を見る',

  // notifications
  'Everything that needs your attention.': '確認が必要なことの一覧です。', 'No notifications.': '通知はありません。', 'Mark all as read': 'すべて既読にする',
  'Notification settings': '通知の設定', 'Event': 'できごと', 'In-app': 'アプリ内', 'Matches': '一致', 'Thanks': 'お礼', 'Storage reminders': '保管期限のお知らせ',
  'Item returned to you': 'アイテムが返却されました', 'The item you found reached the office': 'あなたが届けた物が事務所に届きました',
  'New found item to receive': '受領待ちの新しい拾得物', 'Claim waiting for verification': '確認待ちの請求', 'Ready for handover': '返却待ち',

  // report wizard
  'Where & when': '場所と日時', 'Colour': '色', 'Brand': 'ブランド', 'Marks or stickers': '目印やステッカー',
  'Tell us what you lost. We will look for it among the found items.': 'なくした物を教えてください。拾得物の中から探します。',
  'Tap the place on the map.': '地図で場所をタップしてください。', 'Anything else that helps': 'その他の手がかり', 'Check your report': '届出内容の確認',
  'Photo attached': '写真が添付されています',

  // my items + item detail
  'Everything you reported, with its progress.': '届け出たすべての物と進み具合です。', 'Search my items': 'マイアイテムを検索',
  'No items match this filter.': 'この条件に合うアイテムはありません。', 'Item details': 'アイテムの詳細', 'Finder name': '発見者名',
  'Claim this item': 'このアイテムを請求', 'Answer so staff can check that it is yours.': 'あなたの物であることをスタッフが確認できるよう答えてください。',
  'Progress': '進み具合', 'Suggested match': '一致の候補', 'Open item': 'アイテムを開く', 'Claim sent': '請求を送信済み',

  // matches
  'Found items that look like something you lost.': 'あなたがなくした物に似ている拾得物です。', 'No matches yet': 'まだ候補はありません',
  'When a found item looks like one of your lost reports, it appears here.': 'あなたの届出に似た拾得物があると、ここに表示されます。',
  'Your report': 'あなたの届出', 'Match score': '一致度', 'Not mine': '私の物ではない', 'Not a match': '一致しない',
  'Match removed. Thanks for telling us': '候補を取り消しました。お知らせありがとうございます',
  'Same category': '同じカテゴリ', 'Same place': '同じ場所', 'Same day': '同じ日', 'Date within 2 days': '日付が2日以内',

  // map
  'Where found items were picked up.': '拾得物が見つかった場所です。', 'Show all': 'すべて表示', 'Tap a place on the map to filter.': '地図の場所をタップすると絞り込めます。',
  'No found items here.': 'ここで見つかった物はありません。',

  // pickup + history + certificate
  'Show this at the office together with your photo ID.': '顔写真付きの身分証と一緒に事務所で提示してください。',
  'You have no approved claim yet.': '承認された請求はまだありません。', 'When staff approve your claim, your pickup pass appears here.': 'スタッフが請求を承認すると、ここに受け取りパスが表示されます。',
  'Valid until': '有効期限', 'How pickup works': '受け取りの流れ', 'Go to the office': '事務所へ行く', 'Open hours are shown at the front desk.': '受付時間は受付に掲示されています。',
  'Show your pass and photo ID': 'パスと身分証を見せる', 'Staff check the code and your ID.': 'スタッフがコードと身分証を確認します。',
  'Staff hand over the item': 'スタッフが物を渡す', 'The return is recorded in your history.': '返却は履歴に記録されます。',
  'Items that were returned to you.': 'あなたに返却された物です。', 'Items returned': '返却数', 'From claim to return': '請求から返却まで',
  'Returned items': '返却された物', 'Nothing has been returned to you yet.': 'まだ返却された物はありません。', 'Certificate': '証明書',
  'Certificate of return': '返却証明書', 'This confirms that the item below was returned to its owner at the office.': '下記の物が事務所で持ち主に返却されたことを証明します。',
  'ID checked': '確認した身分証',

  // rewards (sample)
  'Thanks are voluntary and always come from the owner.': 'お礼は任意で、いつも持ち主から送られます。',
  'Sample data. Points and thank-you messages are not saved yet.': 'サンプルデータです。ポイントとお礼メッセージはまだ保存されません。',
  'Badges earned': '獲得バッジ', 'Thank-yous received': '受け取ったお礼', 'Level: Helper': 'レベル：ヘルパー',
  '{n} more points to reach the next level': '次のレベルまであと{n}ポイント', 'Badges': 'バッジ', 'Earned': '獲得済み', 'Locked': '未獲得',
  'First return': '初めての返却', 'Honest finder': '正直な発見者', '5 returns': '返却5回', 'Kind words': 'やさしい言葉',
  'Recent thank-yous': '最近のお礼', 'Thank you so much for returning my backpack!': 'リュックを届けてくれて本当にありがとう！',
  'You saved my day.': 'おかげで助かりました。', 'Thank a finder': '発見者にお礼する', 'Thank-you sent': 'お礼を送りました',

  // messages (sample)
  'Talk to the office about a claim.': '請求について事務所と話せます。', 'Talk to owners about their claims.': '請求について持ち主と話せます。',
  'Sample conversations. Messages are not saved yet.': 'サンプルの会話です。メッセージはまだ保存されません。', 'Office staff': '事務所スタッフ',
  'Write a message': 'メッセージを入力', 'Hello! Can you tell us the colour of the case?': 'こんにちは。ケースの色を教えていただけますか？',
  'It is white with a star sticker.': '白で、星のステッカーが付いています。', 'Thank you. That matches. Please bring your ID.': 'ありがとうございます。一致しました。身分証をお持ちください。',
  'We received your claim and will check it today.': '請求を受け付けました。本日中に確認します。',

  // profile
  'Your account and what others can see.': 'あなたのアカウントと、他の人に見える情報です。', 'Switch community': 'コミュニティを変更',
  'Change password': 'パスワードを変更', 'Current password': '現在のパスワード', 'New password': '新しいパスワード', 'Save password': 'パスワードを保存',
  'Password changed': 'パスワードを変更しました', 'Current password is wrong.': '現在のパスワードが正しくありません。', 'Privacy': 'プライバシー',
  'Hide my name from finders': '発見者に名前を表示しない', 'Only staff can see who you are': 'あなたが誰かはスタッフだけが分かります',
  'Show my email to staff': 'スタッフにメールアドレスを表示', 'Helps staff contact you about a claim': '請求についてスタッフが連絡しやすくなります',
  'Email notifications': 'メール通知', 'Get important updates by email': '大事なお知らせをメールで受け取る', 'Your data': 'あなたのデータ',
  'Download a copy of what the system stores about you.': 'システムに保存されているあなたの情報をダウンロードできます。',
  'Download my data': 'データをダウンロード', 'Delete my account': 'アカウントを削除', 'Please contact your administrator': '管理者に連絡してください',

  // how it works
  'Three steps to get your item back.': '3つのステップで物が戻ります。', 'Hand in or report': '届ける・届け出る',
  'Found items are handed to the office. Lost items are reported here.': '拾った物は事務所へ届けます。なくした物はここで届け出ます。',
  'We match and verify': '照合と確認', 'The system suggests matches. Staff check your answers.': 'システムが候補を探し、スタッフが回答を確認します。',
  'Pick up with your ID': '身分証を持って受け取る', 'Show your pickup pass and a photo ID at the office.': '事務所で受け取りパスと顔写真付きの身分証を見せます。',
  'Questions': 'よくある質問', 'Why must I show an ID?': 'なぜ身分証が必要ですか？', 'Staff must be sure that the item goes to its owner.': '物が確実に持ち主に戻るようにするためです。',
  'Can I keep something I found?': '拾った物を持っていてもいいですか？', 'No. Please hand every found item to the office.': 'いいえ。拾った物はすべて事務所に届けてください。',
  'Is a thank-you required?': 'お礼は必要ですか？', 'No. Thank-you messages and gifts are voluntary.': 'いいえ。お礼のメッセージや品物は任意です。',
  'How long are items kept?': '物はどのくらい保管されますか？',
  'Your organization sets the storage period. Owners get a warning before it ends.': '保管期間は組織が決めます。期限の前に持ち主へお知らせが届きます。',

  // handover + storage
  'Check the ID and hand the item to its owner.': '身分証を確認して、持ち主に物を渡します。', 'No approved claims are waiting for handover.': '返却待ちの承認済み請求はありません。',
  'Owner showed the pickup pass': '持ち主が受け取りパスを提示した', 'Photo ID matches the owner': '顔写真付きの身分証が本人と一致',
  'Answers match the item': '回答が物と一致', 'ID shown': '提示された身分証', 'Complete handover': '返却を完了',
  'See which shelves are full and where an item is.': 'どの棚がいっぱいか、物がどこにあるかが分かります。',
  'No item with this code at the office': 'このコードの物は事務所にありません', 'Items on shelf {shelf}': '棚 {shelf} のアイテム', 'This shelf is empty.': 'この棚は空です。',
  'Days kept': '保管日数',

  // dashboard + alerts
  'How lost and found is going in your organization.': '組織の落とし物の状況です。', 'Items reported': '届出数', 'Items by category': 'カテゴリ別',
  'Needs attention': '対応が必要', 'Expiring soon': 'まもなく期限切れ',
  'Everything that needs attention in one list.': '対応が必要なことを1つにまとめた一覧です。', 'Nothing needs attention right now.': '今、対応が必要なことはありません。',
  'Items waiting to be received': '受領待ちのアイテム', 'Claims waiting for verification': '確認待ちの請求', 'Items expiring soon': 'まもなく期限切れのアイテム',
  'Shelf almost full': 'ほぼ満杯の棚', 'Membership requests': '参加申請',
  '{n} items have waited more than 3 days.': '{n}件が3日以上待っています。', '{n} claims have waited more than 2 days.': '{n}件の請求が2日以上待っています。',
  '{n} owners can collect their item.': '{n}人の持ち主が受け取りに来られます。', '{n} items reach the storage period within 14 days.': '{n}件が14日以内に保管期限を迎えます。',
  '{n} people are waiting to join.': '{n}人が参加を待っています。',

  // all items, match review, item history
  'Every item in your organization.': '組織のすべてのアイテムです。', 'Search items': 'アイテムを検索', 'No items match.': '一致するアイテムはありません。',
  'Check what the system suggested, remove wrong matches, or link items by hand.': 'システムの候補を確認し、間違いを取り消したり、手動で結び付けたりします。',
  'There are no open matches.': '未処理の候補はありません。', 'Lost report': '紛失の届出', 'Found item': '拾得物', 'Confidence': '確からしさ',
  'Claim: {status}': '請求：{status}', 'Open lost report': '紛失届を開く', 'Open found item': '拾得物を開く',
  'Link manually': '手動で結び付ける', 'Choose the lost report and the found item that belong together.': '対応する紛失届と拾得物を選んでください。',
  'Link items': '結び付ける', 'Items linked': '結び付けました', 'There are no open lost reports or found items to link.': '結び付けられる紛失届や拾得物はありません。',
  'Who handled this item and when.': '誰がいつこの物を扱ったかです。', 'Timeline': 'タイムライン',

  // expiry + disposal
  'Items that stay unclaimed for too long.': '長い間請求のない物です。', 'Expired': '期限切れ', 'Time left': '残り期間', 'Actions': '操作',
  'Notify owner': '持ち主に通知', 'Owner notified': '持ち主に通知しました', 'Extend 30 days': '30日延長', 'Storage extended': '保管期間を延長しました', 'Dispose': '処分',
  'Every item that left the office without its owner.': '持ち主に返らず事務所から出た物の記録です。',
  'Disposals are not saved yet. The history below is sample data.': '処分はまだ保存されません。下の履歴はサンプルです。',
  'Record a disposal': '処分を記録', 'Method': '方法', 'Reason': '理由', 'Record disposal': '処分を記録する', 'Disposal recorded': '処分を記録しました',
  'Donated': '寄付', 'Handed to police': '警察に届けた', 'Recycled': 'リサイクル', 'Disposed': '廃棄',
  'Storage period over': '保管期間の終了', 'Possible personal data': '個人情報を含む可能性', 'e.g. Storage period over': '例：保管期間の終了',

  // roles + staff activity
  'Decide who can do what.': '誰が何をできるかを決めます。', 'Member since': '参加日', 'What each role can do': '役割ごとにできること', 'Permission': '権限',
  'Report items': '物を届け出る', 'Receive found items': '拾得物を受領する', 'Verify claims and hand over': '請求を確認して返却する',
  'Manage users and roles': 'ユーザーと役割を管理', 'View audit log': '監査ログを見る', 'Change settings': '設定を変更', 'Manage organizations': '組織を管理',
  'Role updated': '役割を更新しました', 'Remove access': 'アクセスを削除', 'Access removed': 'アクセスを削除しました',
  'Remove {name} from this organization?': '{name}さんをこの組織から外しますか？', 'Invite staff': 'スタッフを招待',
  'We will send an invitation by email.': '招待をメールで送ります。', 'Send invitation': '招待を送る', 'Invitation sent': '招待を送りました',
  'Member not found.': 'メンバーが見つかりません。', 'You cannot change your own access.': '自分のアクセスは変更できません。', 'Unknown role.': '不明な役割です。',
  'How much each person handled.': '各スタッフが対応した件数です。', 'Items received': '受領した数', 'Claims verified': '確認した請求',
  'Items handed over': '返却した数', 'Latest actions': '最近の操作', 'No staff actions yet.': 'スタッフの操作はまだありません。',

  // reports, hotspots, audit
  'A summary you can save or print.': '保存や印刷ができるまとめです。', 'Lost reports': '紛失の届出', 'Return rate': '返却率', 'By category': 'カテゴリ別',
  'Return rate = found items from this month that are already back with their owner.': '返却率 = この月の拾得物のうち、すでに持ち主に戻った割合。',
  'Where items get lost and found the most.': '物が最もなくなる・見つかる場所です。', 'Ranking': 'ランキング', 'When reports are made': '届出の時間帯',
  'Most reports are made between {time}. A reminder at that time could help.': '届出は{time}時に最も多いです。その時間に呼びかけると効果的です。',
  'Who did what, and when.': '誰が、いつ、何をしたか。', 'Shows the latest 200 events. Logins are not recorded yet.': '最新200件を表示します。ログインはまだ記録されません。',
  'Lost item reported': '紛失の届出', 'Found item reported': '拾得の届出', 'Item received at office': '事務所で受領', 'Item handed over': '返却済み',
  'Membership requested': '参加申請',

  // settings + thank-you rules
  'General': '一般', 'Categories': 'カテゴリ', 'Places & shelves': '場所と棚', 'ID types': '身分証の種類',
  'Warn owners before items expire': '期限前に持ち主へ知らせる', 'Sent 7 days before the end': '期限の7日前に送ります',
  'Item categories': 'アイテムのカテゴリ', 'Places on the map': '地図上の場所', 'Shelves': '棚', 'Accepted ID types': '使える身分証',
  'New category': '新しいカテゴリ', 'New place': '新しい場所', 'New shelf': '新しい棚', 'New ID type': '新しい身分証の種類',
  'Thank-yous are always voluntary and come from the owner.': 'お礼はいつも任意で、持ち主から送られます。',
  'Sample settings. These rules are not saved yet.': 'サンプルの設定です。これらのルールはまだ保存されません。',
  'Enable thank-you messages': 'お礼メッセージを使う', 'Owners can write a message after a return': '返却後に持ち主がメッセージを書けます',
  'Allow small gifts': 'ささやかな贈り物を許可', 'Gift card codes only': 'ギフトカードのコードのみ', 'Show badges to finders': '発見者にバッジを表示',
  'Badges appear on the finder profile': '発見者のプロフィールにバッジが表示されます', 'Item handed to the office': '物を事務所に届けた',
  'Item returned to its owner': '物が持ち主に戻った', 'Thank-you received': 'お礼を受け取った',

  // super admin
  'All organizations on the service.': 'サービスを利用するすべての組織です。', 'Average return rate': '平均返却率', 'Items per organization': '組織ごとのアイテム数',
  'Important events across all organizations.': 'すべての組織の重要なできごとです。',

  // members post found items directly
  'Registered': '登録済み', 'Still with the finder': '発見者が保管中', 'With the finder': '発見者が保管中',
  'Found by: {name}': '発見者：{name}', 'Owner: {name}': '持ち主：{name}', 'Hand over': '返却する', 'Brought to the office': '事務所に届いた',
  'Posted by members and already listed for everyone. When the finder brings one to the office, record it here.': '会員が投稿し、すでに全員に公開されている物です。発見者が事務所に持ってきたら、ここで記録してください。',
  'No found items are waiting outside the office.': '事務所の外で保管中の拾得物はありません。',
  'A member posted a found item': '会員が拾得物を投稿しました',
  'For items someone brings to the office. Add the item and print its storage label.': '事務所に持ち込まれた物を登録し、保管ラベルを発行します。',
  'It is already listed for the community. Check the details, then add the shelf where it is stored.': 'すでにコミュニティに公開されています。内容を確認し、保管する棚を選んでください。',
  '{n} posted items have not been brought to the office for 3 days or more.': '投稿された{n}件が3日以上事務所に届いていません。',
  'Posted. Everyone in your community can now see it': '投稿しました。コミュニティの全員が見られます',
  'It is listed for your community right away': 'すぐにコミュニティに公開されます',
  'Everyone in your community can see it in Found items and the owner can claim it. Keep it safe. Staff check the owner’s ID before it is returned.': 'コミュニティの全員が拾得物一覧で見られ、持ち主が請求できます。大切に保管してください。返却前にスタッフが持ち主の身分証を確認します。',
  'If the item is already at the office, use Register found item to add its shelf.': '物がすでに事務所にある場合は「拾得物を登録」で棚を登録してください。',
  'The item is still with the finder': '物はまだ発見者が持っています',
  'Ask {name} to bring it to the office, then hand it to the owner here.': '{name}さんに事務所へ持ってきてもらい、ここで持ち主に渡してください。',
  'You posted this item, so you cannot claim it.': 'あなたが投稿した物なので請求できません。',
  'This item is not registered yet.': 'このアイテムはまだ登録されていません。',
  'Only open lost reports and unclaimed found items can be linked.': '結び付けられるのは、未処理の紛失届と請求のない拾得物だけです。',

  // development login
  'Development mode': '開発モード', 'Name or email': '名前またはメールアドレス', 'e.g. Aiko Tanaka': '例：Aiko Tanaka', 'Log in as': 'このアカウントでログイン',
  'No password needed. Type a name or email, or pick an account below.': 'パスワードは不要です。名前かメールアドレスを入力するか、下からアカウントを選んでください。',
  'Development mode: no password needed. The account gets the password 123456.': '開発モード：パスワードは不要です。アカウントのパスワードは123456になります。',
  'No account with this name or email.': 'この名前またはメールアドレスのアカウントはありません。',
  'More than one account has this name. Use the email instead.': '同じ名前のアカウントが複数あります。メールアドレスを使ってください。',

  // finder hands the item to the office
  'Someone has claimed the item you reported': 'あなたが届けた物に請求がありました',
  'The owner was confirmed. Please hand the item to the office': '持ち主が確認されました。物を事務所に届けてください',
  'A finder handed an item to the office. Please confirm it': '発見者が物を事務所に届けました。確認してください',
  'Hand over to the office': '事務所に届ける', 'I handed it to the office': '事務所に届けました',
  'Take the item to the office front desk and tell staff this item code.': '物を事務所の受付に持って行き、このアイテムコードを伝えてください。',
  'Press the button below after you gave the item to staff. Staff will confirm it.': 'スタッフに渡したら下のボタンを押してください。スタッフが確認します。',
  'Thank you. Staff will confirm the item': 'ありがとうございます。スタッフが確認します',
  'You handed this item to the office': 'この物を事務所に届けました',
  'Handed in {time}. Staff will confirm it and keep it until the owner collects it.': '{time}に届けました。スタッフが確認し、持ち主が受け取るまで保管します。',
  'You are keeping this item': 'この物はあなたが保管しています',
  'Please take it to the office. Staff check the owner’s ID there and return it.': '事務所に持って行ってください。スタッフがそこで持ち主の身分証を確認して返却します。',
  'When you can, hand it to the office so the owner can collect it there.': 'できるときに事務所に届けてください。持ち主はそこで受け取れます。',
  'Finder handed it to the office': '発見者が事務所に届けた', 'Finder says it is at the office': '発見者が事務所に届けた',
  'Confirm and add shelf': '確認して棚を登録',
  'The finder says the item is at the office': '発見者は物を事務所に届けたと言っています',
  'Confirm it in the Work queue (add the shelf), then hand it to the owner here.': '作業リストで確認（棚を登録）してから、ここで持ち主に渡してください。',
  'This item is already at the office.': 'この物はすでに事務所にあります。',
  'You already handed this item to the office.': 'この物はすでに事務所に届けています。',

  // hubs, tabs and new screens
  'Menu': 'メニュー', 'Management': '管理', 'Intake': '受付・登録', 'Item list': 'アイテム一覧', 'Storage': '保管', 'Insights': '分析',
  'Profile': 'プロフィール', 'Privacy & data': 'プライバシーとデータ', 'Your profile, your community and help.': 'プロフィール、コミュニティ、ヘルプ。',
  'You have not joined a community yet.': 'まだコミュニティに参加していません。', 'Waiting for approval: {org}': '承認待ち：{org}', 'Find your community': 'コミュニティを探す',
  'Report or post': '届け出る・投稿する', 'Lost something? Report it. Found something? Post it so everyone can see it.': 'なくしたら届け出、拾ったら投稿してみんなに知らせます。',
  'Match and claim': '照合と請求', 'The system suggests matches. The owner claims the item and describes it.': 'システムが候補を出し、持ち主が特徴を書いて請求します。',
  'Check at the office': '事務所で確認', 'Staff compare the answers with private details and check a photo ID.': 'スタッフが回答と非公開の特徴を照らし合わせ、身分証を確認します。',
  'Pick it up': '受け取る', 'The owner shows the pickup code and takes the item home.': '持ち主は受け取りコードを伝えて物を受け取ります。',
  'Why are some details hidden?': 'なぜ一部の情報は非表示なのですか？',
  'Found items show only general information. The owner must describe the rest, so nobody can copy the answers.': '拾得物は一般的な情報だけを表示します。残りは持ち主が説明するので、他人が答えをまねできません。',
  'No. Post it here and hand it to the office when someone claims it.': 'いいえ。ここに投稿し、請求があったら事務所に届けてください。',
  'Your organization sets the storage period. Items that are not collected are reported to the police, as the law requires.': '保管期間は組織が決めます。受け取られない物は法律に従って警察に届けます。',
  // browse
  'Items people found in your community. Private details are hidden so only the owner can describe them.': 'コミュニティで見つかった物です。持ち主だけが説明できるよう、細かい特徴は非表示です。',
  'Search found items': '拾得物を検索', 'Grid': '一覧', 'Map': 'マップ', 'Showing items from {place}.': '{place}の物を表示しています。', 'Owner found': '持ち主確認済み',
  'You posted this': 'あなたの投稿', 'No found items here yet.': 'まだ拾得物はありません。',
  'Try another category, or report what you lost so we can tell you when it turns up.': '別のカテゴリを試すか、なくした物を届け出てください。見つかったらお知らせします。',
  // home
  'Bring your photo ID and pickup code to the office.': '身分証と受け取りコードを持って事務所へお越しください。', 'Report it and get matches': '届け出て候補を受け取る',
  'Post it so the owner can claim it': '投稿して持ち主に知らせる', 'Look for your item': '自分の物を探す', 'Nothing in progress.': '進行中のものはありません。',
  'Lost or found something? Report it in a few taps.': 'なくした・拾った？数タップで届け出られます。', 'Items you got back': '戻ってきた物',
  // my items
  'Checking your answers': '回答を確認中', 'Ready to pick up': '受け取り可能', 'Not approved': '承認されませんでした',
  'Things I lost': 'なくした物', 'Things I found': '拾った物', 'My claims': '自分の請求',
  'Everything you reported or claimed. Click a card to see the details.': '届け出た物と請求した物の一覧です。カードをクリックすると詳細が開きます。',
  'Your description': 'あなたの説明', 'See my claim': '請求を見る', 'We will tell you when a found item looks like this.': '似た拾得物が見つかったらお知らせします。',
  'Full details': '詳細ページ', 'You have not reported anything lost.': 'なくした物はまだ届け出ていません。',
  'Report it and we will look for it among the found items.': '届け出ると拾得物の中から探します。', 'Someone claimed it': '請求あり', 'Where it is': '今どこにあるか',
  'Returned to its owner. Thank you!': '持ち主に返却されました。ありがとうございます！', 'At the office (shelf {shelf}).': '事務所で保管中（棚 {shelf}）。',
  'You handed it to the office. Staff will confirm it.': '事務所に届けました。スタッフが確認します。', 'You are keeping it.': 'あなたが保管しています。',
  'Nobody has claimed it yet.': 'まだ請求はありません。', 'Someone has claimed it. Staff are checking it.': '請求がありました。スタッフが確認中です。',
  'The owner was confirmed.': '持ち主が確認されました。', 'The owner got it back.': '持ち主に返却されました。',
  'You have not posted any found items.': '拾った物はまだ投稿していません。', 'Found something? Post it so the owner can find it.': '何か拾いましたか？投稿すると持ち主が見つけられます。',
  'Staff are comparing your answers with the details only the owner would know. You will get a notification.': 'スタッフが、持ち主だけが知る特徴とあなたの回答を照らし合わせています。結果は通知でお知らせします。',
  'Your answers': 'あなたの回答',
  'Staff could not confirm that this item is yours. If you think this is a mistake, ask at the office.': 'あなたの物であることを確認できませんでした。間違いだと思う場合は事務所にお問い合わせください。',
  'You have no claims yet.': 'まだ請求はありません。', 'When you find your item in Found items, press "This is mine".': '拾得物一覧で自分の物を見つけたら「私のものです」を押してください。',
  // pickup pass
  'Pickup code': '受け取りコード', 'Tell this pickup code to staff': 'この受け取りコードをスタッフに伝えてください', 'Not at the office yet': 'まだ事務所にありません',
  'Show your photo ID and tell the pickup code': '身分証を見せて受け取りコードを伝える', 'Staff check both before they hand over the item.': 'スタッフが両方を確認してから物を渡します。',
  'Take your item home': '物を受け取る',
  // item detail
  'Private details — only staff and the finder see these': '非公開の特徴 — スタッフと発見者だけが見られます',
  'Private details are hidden. The owner describes them when claiming.': '細かい特徴は非表示です。持ち主が請求時に説明します。',
  'Closed: {method}': '終了：{method}', 'Office': '事務所', 'Report to police by': '警察への届出期限',
  'If the owner is not found, report the item to the police within {n} days of receiving it.': '持ち主が見つからない場合は、受領から{n}日以内に警察へ届け出てください。',
  'Closed': '終了', 'Every item in your organization. Click one to see its full history.': '組織のすべてのアイテムです。クリックすると履歴が見られます。',
  'Open found items by the place they were found. Tap a place to filter.': '見つかった場所ごとの拾得物です。場所をタップすると絞り込めます。',
  // front desk
  'Pickups': '受け取り', 'From finders': '発見者から', 'Check owners, hand items over, and take in items people bring.': '持ち主の確認、返却、持ち込まれた物の受付を行います。',
  'Waiting {n} days': '{n}日待ち', 'What the claimant says': '申請者の回答', 'Their lost report': '本人の紛失届', 'Private details of the found item': '拾得物の非公開の特徴',
  'Only staff see this. Does the claimant describe it?': 'スタッフだけが見られます。申請者はこれを説明できていますか？',
  'No private details were recorded. Ask the claimant in person.': '非公開の特徴は記録されていません。申請者に直接確認してください。',
  'Open the item': 'アイテムを開く', 'No claims to verify.': '確認待ちの請求はありません。',
  'New claims appear here. You compare the answers with the private details.': '新しい請求はここに表示されます。回答と非公開の特徴を照らし合わせます。',
  'Shelf {shelf}': '棚 {shelf}', 'Confirm it in "From finders" (add the shelf) first.': '先に「発見者から」で確認（棚を登録）してください。',
  'No pickups waiting.': '受け取り待ちはありません。', 'Approved claims appear here until the owner collects the item.': '承認された請求は、持ち主が受け取るまでここに表示されます。',
  'Claim approved. The owner got a pickup code': '請求を承認しました。持ち主に受け取りコードが発行されました', 'Approve — it matches': '承認（一致しています）',
  'Pickup code from the owner': '持ち主から聞いた受け取りコード',
  'The pickup code does not match. Ask the owner to open their pickup pass.': '受け取りコードが一致しません。持ち主に受け取りパスを開いてもらってください。',
  // intake
  'Register an item': 'アイテムを登録', 'Look up by code': 'コードで検索', 'Register items people bring to the office, or look one up by its code.': '事務所に持ち込まれた物を登録するか、コードで検索します。',
  // storage
  'Deadlines': '期限', 'Closed items': '終了した物', 'What is on the shelves, what is due, and what has left the office.': '棚の状況、期限、事務所から出た物を確認します。',
  'Past the police deadline': '警察への届出期限超過', 'Storage period ending': '保管期間がまもなく終了', 'Report to police within': '警察への届出期限',
  'Japan’s Lost Property Act: a facility reports found items to the police within one week of receiving them, unless the owner collects them first.': '遺失物法：施設占有者は、持ち主が受け取らない限り、拾得物を受領から1週間以内に警察へ提出します。',
  'Police report': '警察への届出', 'Overdue by {n} days': '{n}日超過', '{n} days left': '残り{n}日', 'Nothing is stored at the office.': '事務所に保管中の物はありません。',
  'Note': 'メモ', 'No items have been closed.': '終了した物はありません。', 'Items handed to the police, donated or disposed of are recorded here.': '警察への提出、寄付、廃棄した物はここに記録されます。',
  'Close item': '終了する', 'The item leaves the office without its owner. This is kept in the records.': '持ち主に返らず事務所から出る物です。記録として残ります。',
  'What happened to it': 'どうしたか', 'e.g. Police receipt number': '例：警察の受理番号', 'Item closed': '終了しました',
  'Please choose how the item left the office.': '物がどのように事務所から出たかを選んでください。', 'Note is too long.': 'メモが長すぎます。',
  'This item is already closed.': 'この物はすでに終了しています。', 'This item has an open claim. Decide the claim first.': '未処理の請求があります。先に請求を処理してください。',
  // overview
  '{n} items have been at the office for a week or more. Report them to the police.': '{n}件が1週間以上事務所にあります。警察へ届け出てください。',
  '{n} claims are waiting for a staff check.': '{n}件の請求がスタッフの確認を待っています。',
  // people
  'Report and claim items': '物の届出と請求', 'Register and store items': '物の登録と保管', 'Manage people and roles': 'ユーザーと役割の管理',
  'See insights and the audit log': '分析と監査ログの閲覧', 'Who can use lost and found in your organization, and what staff handled.': '組織で落とし物管理を使える人と、スタッフの対応状況です。',
  // insights
  'Monthly report': '月次レポート', 'Hotspots': 'ホットスポット', 'Reports you can save or print, where items get lost, and who did what.': '保存・印刷できるレポート、なくし物が多い場所、操作の記録です。',
  // report wizard
  'Colour, brand, marks and the description are private: only staff see them and use them to check the real owner.': '色・ブランド・目印・説明は非公開です。スタッフだけが見て、本当の持ち主の確認に使います。',
  'The more details you give, the easier it is to prove the item is yours.': '詳しく書くほど、自分の物だと証明しやすくなります。',
  'Private details (only staff see these)': '非公開の特徴（スタッフだけが見られます）', 'e.g. what is inside, a name tag, a scratch': '例：中身、名札、傷など',

  // overview to-do (count-neutral wording)
  'At the office for a week or more: {n}. Report them to the police.': '1週間以上事務所にある物：{n}件。警察へ届け出てください。',
  'Waiting more than 2 days: {n}.': '2日以上待っている請求：{n}件。',
  'Waiting for a staff check: {n}.': 'スタッフの確認待ち：{n}件。',
  'Owners who can collect their item: {n}.': '受け取り可能な持ち主：{n}人。',
  'Reaching the storage period within 14 days: {n}.': '14日以内に保管期間が終わる物：{n}件。',
  'Posted but not brought to the office for 3 days or more: {n}.': '投稿後3日以上事務所に届いていない物：{n}件。',
  'People waiting to join: {n}.': '参加待ちの人：{n}人。',

  // places + Google Maps
  'Tap a pin to see the item.': 'ピンをタップすると物の詳細が見られます。', '{n} items have no map pin and are only in the list.': '{n}件は地図のピンがないため、一覧だけに表示されます。',
  'Where': '場所', 'Open in Google Maps': 'Googleマップで開く', '{n} items': '{n}件',
  'Blue pins: found items waiting for owners. Orange pins: open lost reports. Tap a pin for details.': '青いピン：持ち主待ちの拾得物。オレンジのピン：未解決の紛失届。ピンをタップすると詳細が見られます。',
  'Please choose or type the place.': '場所を選ぶか入力してください。', 'Map pin': '地図のピン',
  'Place updated': '場所を更新しました', 'Place added': '場所を追加しました', 'Place removed': '場所を削除しました',
  'Remove "{name}" from the list? Items keep their place.': '「{name}」を一覧から削除しますか？登録済みの物の場所はそのままです。',
  'Edit place': '場所を編集', 'Add a place': '場所を追加', 'Click the map to set the pin.': '地図をクリックしてピンを置いてください。',
  'Save place': '場所を保存', 'Add place': '場所を追加', 'Places on the list': '登録済みの場所', 'No places yet. Members can still type a place.': 'まだ場所がありません。会員は場所を入力できます。',
  'No pin': 'ピンなし', 'Edit': '編集', 'e.g. Library 2F': '例：図書館2階', 'e.g. Bus stop in front of the school': '例：学校前のバス停',
  'Or type another place': 'または別の場所を入力', 'Tap the map to mark the exact spot (optional).': '地図をタップして正確な場所に印を付けられます（任意）。',
  'Pin: {lat}, {lng}': 'ピン：{lat}, {lng}', 'Remove pin': 'ピンを外す', 'Found nearby': '近くで発見',
  'The map pin is not valid.': '地図のピンが正しくありません。', 'Please enter the place name.': '場所の名前を入力してください。',
  'This place is already on the list.': 'この場所はすでに登録されています。', 'Place not found.': '場所が見つかりません。',
  'Google Maps could not be loaded': 'Googleマップを読み込めませんでした', 'Google Maps refused the API key. Check the key and its allowed websites.': 'GoogleマップがAPIキーを拒否しました。キーと許可しているサイトを確認してください。',
  'Selected place': '選んだ場所', 'Google Maps is not set up yet': 'Googleマップはまだ設定されていません',
  'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart the app. The lists below still work.': '.env.local に NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を追加して、アプリを再起動してください。下の一覧はそのまま使えます。',
  'The map could not be shown': '地図を表示できませんでした',
  // thank-you letters + gifts
  'You got your item back': '物が戻ってきました', 'Send a thank-you letter to the person who found it.': '見つけてくれた人にお礼の手紙を送りましょう。',
  'Write a thank-you letter': 'お礼の手紙を書く', 'Thanks sent': 'お礼を送りました', 'Say thank you': 'お礼を伝える',
  'You got it back. A short letter means a lot to the finder.': '物が戻りました。短い手紙でも発見者はとても喜びます。',
  'Letters you received': '受け取った手紙', 'Letters you sent': '送った手紙', 'The owner of {item}': '{item}の持ち主', 'New': '新着', 'E-gift': 'eギフト',
  'No letters yet.': 'まだ手紙はありません。', 'When an owner gets back an item you found, they can send you a thank-you letter here.': 'あなたが見つけた物が持ち主に戻ると、ここにお礼の手紙が届きます。',
  'Code copied': 'コードをコピーしました', 'Copy code': 'コードをコピー', 'Test gift: this code cannot be used in a shop.': 'テスト用ギフトです。このコードはお店では使えません。',
  'Show gift code': 'ギフトコードを表示',
  'Thank you so much for finding it!': '見つけてくださって本当にありがとうございます！', 'Thank you for taking it to the office.': '事務所に届けてくださってありがとうございます。',
  'Card form could not be loaded': 'カード入力欄を読み込めませんでした', 'Please enter the name on the card.': 'カードの名義を入力してください。', 'Card error': 'カードのエラー',
  'Your letter and gift were sent': '手紙とギフトを送りました', 'Your letter was sent': '手紙を送りました', 'Required': '必須',
  '1. Choose a card': '1. カードを選ぶ', '2. Write your letter': '2. 手紙を書く', '3. Add an e-gift': '3. eギフトを添える',
  'classic': 'クラシック', 'sakura': 'さくら', 'sunny': 'ひまわり', 'mint': 'ミント',
  'Write a few words to the person who found your item': '物を見つけてくれた人に一言書きましょう', 'Sign with my name ({name})': '名前を書く（{name}）',
  'E-gifts are not available yet. You can still send your letter.': 'eギフトはまだ使えません。手紙は送れます。',
  'Add an e-gift card to my letter': '手紙にeギフトカードを添える', 'Gift card': 'ギフトカード', 'Amount': '金額', 'Name on the card': 'カードの名義', 'Card': 'カード',
  'Test mode: no real money moves. Use card 4242 4242 4242 4242, any future date, any CVC.': 'テストモード：実際のお金は動きません。カード番号 4242 4242 4242 4242、有効期限は未来の日付、CVCは任意で試せます。',
  'Payment is processed by PAY.JP with 3-D Secure. This app never sees or stores your card number.': '支払いはPAY.JP（3Dセキュア）で処理されます。このアプリはカード番号を見たり保存したりしません。',
  'Pay ¥{n} and send': '¥{n}を支払って送る', 'Send letter': '手紙を送る', 'Preview': 'プレビュー',
  'A letter to the person who found your {item}. Gifts are optional.': '{item}を見つけてくれた人への手紙です。ギフトは任意です。', 'See it': '見る',
  'Please write a thank-you message.': 'お礼のメッセージを書いてください。', 'The message is too long.': 'メッセージが長すぎます。', 'Please choose a card.': 'カードを選んでください。',
  'You can send thanks after you got the item back.': '物を受け取った後にお礼を送れます。', 'You already sent thanks for this item.': 'この物のお礼はすでに送っています。',
  'Please choose a gift.': 'ギフトを選んでください。', 'Please enter your card.': 'カード情報を入力してください。',
  'Gift cards are not available yet. You can still send the letter.': 'ギフトカードはまだ使えません。手紙は送れます。',
  'Your thanks could not be saved. Any payment was refunded.': 'お礼を保存できませんでした。支払いは返金されました。',
  'Gift cards are not connected yet. Your card was not charged.': 'ギフトカードはまだ接続されていません。カードへの請求はありません。',
  'You received a thank-you letter and a gift': 'お礼の手紙とギフトが届きました', 'You received a thank-you letter': 'お礼の手紙が届きました',
  'Amazon gift card': 'Amazonギフトカード', 'QUO Card Pay': 'QUOカードPay', 'Starbucks eGift': 'スターバックス eGift',
  'Enter the code at amazon.co.jp → Gift cards → Redeem.': 'amazon.co.jp の「ギフトカード → 登録」でコードを入力してください。',
  'Open the code link on your phone and show the barcode at the shop.': 'スマホでコードのリンクを開き、お店でバーコードを見せてください。',
  'Show the code at the counter.': 'レジでコードを見せてください。',
  'Your card was declined. Please try another card.': 'カードが承認されませんでした。別のカードをお試しください。',
  'The payment could not be completed. Please try again.': '支払いを完了できませんでした。もう一度お試しください。',
  'Card payments are not set up yet.': 'カード決済はまだ設定されていません。',
  'Thank-you letter sent': 'お礼の手紙を送信', 'Thank-you letter and gift sent': 'お礼の手紙とギフトを送信',

  // match errors
  'This match was already removed.': 'この候補はすでに取り消されています。', 'This match is already being claimed.': 'この候補はすでに請求が進んでいます。',
  'One of these items is already matched.': 'どちらかのアイテムはすでに結び付けられています。',
  'Only open lost reports and found items at the office can be linked.': '結び付けられるのは、未処理の紛失届と事務所にある拾得物だけです。',

  // errors (from the server)
  'Your session expired. Please log in again.': 'セッションの有効期限が切れました。もう一度ログインしてください。', 'Please log in.': 'ログインしてください。',
  'Invalid email or password.': 'メールアドレスまたはパスワードが正しくありません。', 'Please fill in all fields.': 'すべての項目を入力してください。',
  'Name is too long.': '名前が長すぎます。', 'Please enter a valid email address.': '有効なメールアドレスを入力してください。',
  'Password must be at least 6 characters.': 'パスワードは6文字以上にしてください。', 'Password must be at most 72 characters.': 'パスワードは72文字以内にしてください。',
  'This email is already registered.': 'このメールアドレスは既に登録されています。',
  'Organization not found.': '組織が見つかりません。', 'You are already a member': 'すでにメンバーです', 'Request already sent': '申請は送信済みです',
  'Unknown action.': '不明な操作です。', 'Request not found.': '申請が見つかりません。', 'This request was already handled.': 'この申請はすでに処理済みです。',
  'Join a community before reporting an item.': '届け出る前にコミュニティに参加してください。', 'Join a community first.': '先にコミュニティに参加してください。',
  'Please say whether this was lost or found.': 'なくしたのか見つけたのかを選んでください。',
  'Please fill in the item name, category and place.': 'アイテム名、カテゴリ、場所を入力してください。',
  'Please fill in the item name, category, place and shelf.': 'アイテム名、カテゴリ、場所、棚を入力してください。',
  'Item name is too long.': 'アイテム名が長すぎます。', 'Category is too long.': 'カテゴリが長すぎます。', 'Place is too long.': '場所が長すぎます。',
  'Shelf is too long.': '棚の名前が長すぎます。', 'Finder name is too long.': '発見者名が長すぎます。', 'Description is too long.': '説明が長すぎます。',
  'Please enter a valid date.': '有効な日付を入力してください。', 'Photo must be an image.': '写真は画像ファイルにしてください。',
  'Photo is too large. Please use a smaller image.': '写真が大きすぎます。もっと小さい画像をお使いください。',
  'Staff only.': 'スタッフ専用です。', 'Administrators only.': '管理者専用です。', 'Item not found.': 'アイテムが見つかりません。',
  'This item was already received.': 'このアイテムはすでに受領済みです。', 'Please enter an item code.': 'アイテムコードを入力してください。',
  'Please answer the verification questions.': '本人確認の質問に答えてください。', 'Answer is too long.': '回答が長すぎます。',
  'This item is not at the office yet.': 'このアイテムはまだ事務所に届いていません。', 'This item has already been returned.': 'このアイテムはすでに返却済みです。',
  'You already sent a claim for this item.': 'このアイテムにはすでに請求を送信済みです。', 'Claim not found.': '請求が見つかりません。',
  'This claim was already handled.': 'この請求はすでに処理済みです。', 'This claim is not ready for handover.': 'この請求はまだ返却できません。',
  'Please select the ID shown.': '提示された身分証を選択してください。', 'Server error. Please try again.': 'サーバーエラーです。もう一度お試しください。',
  'Something went wrong': '問題が発生しました', 'Try again': '再読み込み',
  'If this keeps happening, check that MySQL is running and that .env.local is set up.': '繰り返し発生する場合は、MySQLが起動しているか、.env.localの設定を確認してください。',
};

// Messages with user data inside them (mostly server errors).
const P: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Nothing matches “(.+)”\. Check the label and try again\.$/, m => `「${m[1]}」に一致するアイテムはありません。ラベルを確認してもう一度お試しください。`],
];

const fill = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all)) : s;

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  if (lang !== 'ja') return fill(key, vars);
  let s = J[key];
  if (s === undefined) {
    for (const [re, f] of P) {
      const m = key.match(re);
      if (m) { s = f(m); break; }
    }
  }
  return fill(s ?? key, vars);
}

export const makeT = (lang: Lang): T => (key, vars) => translate(lang, key, vars);
