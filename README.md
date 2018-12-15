# simple_datepicker
Datepicker dependent for javascript library (ex. jquery, bootstrap)

https://watkazuki.github.io/simple_datepicker/

### 概要

特定のフレームワーク、ライブラリの異存なしで使うことのできるDatepickerです。  
jQueryをお使いの場合、jQueryからの呼び出しも可能です。

__カレンダーの設置__

```
var form = document.getElementById('input-form');
form.calendar();
```

inputフォームに、カレンダーを設置することができます。

__jQueryの場合__

```
$('#input-form').calendar();
```

#### プロパティ

また、以下のプロパティも追加することができます。  

```
<script>
  var input = document.getElementById('input');
  input.calendar({
    lang: 'ja'
    // 'ja'か'en'のみ。default: ja
    separator: '/',			  //	各項目の区切り文字(1文字)
    display_date: date()	//	表示させたい月(Dateオブジェクト)
    from: date(),					//	それ以下の日は選択不可(Dateオブジェクト)
    to: date(),						//	それ以降の日は選択不可(Dateオブジェクト)
  })
</script>
```

#### 一覧

##### lang: string
年・月・日の表示言語。  
- デフォルト: ja

- 候補
  - ja: 日本語表示
  - en: 英語表示

##### separator: string
inputに表示する際の区切り文字。(1文字)  
- デフォルト: /

##### display_date: DateObj

DatePickerを初期表示させたい月。
- デフォルト: 現在時刻

##### from: DateObj

この日付より前の日付は選択不可。
- デフォルト: なし

##### to: DateObj

この日付より後の日付は選択不可。
- デフォルト: なし
