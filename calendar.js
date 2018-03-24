;
//	javascriptから呼び出せるカレンダーです。

//	var form = document.getElementById('input-form');
//	form.calendar();

//	でカレンダーを設置することができます。

//	1行目  <<  2018 March >>								this.theader()
//	2行目  Sun Mon Tue Wed Thu Fri Sat			this.header()
//	3行目~ 1   2   3   4   5   6   7...			this.main()
//	最終行		today													 this.tfoot()

/*
//	また、以下のプロパティも追加することができます。
//	コーディングの際はresolveProps()に記載してあります。
//	実装時はプロパティが無いことを前提にして実装してください。
<script>
	var input = document.getElementById('input');
	input.calendar({
		lang: 'ja'				//	'ja'か'en'のみ。default: ja
		separator: '/',			//	各項目の区切り文字(1文字)
		display_date: date()	//	表示させたい月(フォームに元から値が入っている場合、そちらが優先されます)
		from: date(),					//	それ以下の日は選択不可
		to: date(),						//	それ以降の日は選択不可
	})
</script>
*/

/*
未対応事項
・画面下に表示された場合、フォームの上側にcalendarを表示する

	→ this.render()にフォームの位置を指定している箇所をみる

・入力した際にカレンダーと合致する場合はその箇所をカレンダー表示する
	(phpなどで最初から日付が指定されている場合のみは対応済み)

	→ this.register()にaddEventListener('keydown', function()...)と実装していく？

・ie(未確認)
	→ 根気
*/

var Calendar = function() {};
Calendar.prototype.init = function( props_ )
{
	this.m =
	{
		//	cssスタイル(クラス、id名)

		//	全体idの前に付ける文字
		//	(id名はランダムな一意の文字で決定される)
		id_entire:       '',

		//	caution: 変更するとcssのスタイルが適用されなくなる
		class_entire:    'cal',				//	全体クラス
		class_selectbox: 'selectbox',	//	1行目、年・日付を選択する箇所
		class_week:      'week',			//	2行目、曜日の列
		class_saturday:  'sat',				//	土曜日
		class_sunday:    'sun',				//	日曜日
		class_otherday:  'other',			//	前月、次月
		class_today:     'today',			//	今日
		class_selected:  'selected',	//	選択された日付
		class_noselect:  'noselect',	//	選択不可

		CAL_HEIGHT: 226,

		//	プロパティ格納用(this.resolvePropsで値が確定される)

		//	区切り文字
		separator: '-',

		//	曜日・月(デフォルトで日本語表示)
		lang: 'ja',
		week_name: ['日', '月', '火', '水', '木', '金', '土'],
		month_name: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],

		//	日付指定
		display_date: new Date(),	//	カレンダーに表示する月
		from_date: '',						//	この日以前は登録できない
		to_date:   '',						//	この日以降は登録できない

		//	form
		//	定義されたinputのelement要素(= document.getElementById())
		input_elem: '',

		selected_date: null,			//	選択された日付

		dummy: null
	};

	//	プロパティを反映
	this.resolveProps(props_);

	//	初期化処理
	this.register();

	//	カレンダーを表示
	this.render();
};

//------------------------------------------------------------------------------
//	プロパティの設定
//------------------------------------------------------------------------------
Calendar.prototype.resolveProps = function( props_ )
{
	if( !props_.elem ) throw new Error('please set <input type="text">');

		//	カレンダー登録元のelement要素を登録
		this.m.input_elem = props_.elem;

	//	言語設定
	if( props_.lang )
	{
		switch( props_.lang )
		{
			case 'ja':
				this.m.week_name = ['日', '月', '火', '水', '木', '金', '土'];
				this.m.month_name = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
				break;
			case 'en':
				this.m.lang = 'en';
				this.m.week_name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
				this.m.month_name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
				break;
		}
	}

	//	区切り文字
	if( props_.separator ) this.m.separator = String(props_.separator);

	//	表示月が設定されていれば、その月を表示する
	if( props_.display_date && this.isDateObj(props_.display_date) )
		this.m.display_date = props_.display_date;

	//	選択開始月
	if( props_.from && this.isDateObj(props_.from) )
		this.m.from_date = props_.from;

	//	選択終了月
	if( props_.to && this.isDateObj(props_.to) )
		this.m.to_date = props_.to;
}

//	最初に一度だけ行う処理
Calendar.prototype.register = function()
{
	//	固有idの設定(既に存在する場合作り直し)
	while(1)
	{
		this.m.id_entire = this.m.id_entire + this.genString(5);
		if(!document.getElementById(this.m.id_entire))
			break;
	}

	//	カレンダーに元から入っている値がある場合、指定値(2013-03-01など)なら、formに反映する
	if( this.m.input_elem.value ) this.reflectValue(this.m.input_elem.value);

	//	calendar、form以外の部分をクリックするとcalendar非表示
	window.addEventListener('click', function( e_ )
	{
		//	フォーム要素でない  かつ  親要素にidを含まない = カレンダー非表示
		/* caution: closest()はie非対応のため、this.closest()をpolyfillから実装しています。
				ie非対応のコード
			if( !(e_.target === this.m.input_elem || e_.target.closest('#' + this.m.id_entire)) ) */
		if( !(e_.target === this.m.input_elem || this.closest(e_.target, '#'+this.m.id_entire)) )
			document.getElementById(this.m.id_entire).style.display = 'none';
	}.bind(this));

}

//------------------------------------------------------------------------------
//	描画・更新
//------------------------------------------------------------------------------

//	カレンダーの要素を作成して表示する
//	caution: 何度も呼び出される関数なので、addeventlistenerを使うと重複登録される。onclick, onfocusなどを使用すること。
Calendar.prototype.render = function( updated_ )
{
	//	カレンダー作成
	var calendar = this.build();

	//	formにフォーカスを当てるとcalendar表示
	this.m.input_elem.onfocus = function()
	{
		if( calendar.style.display !== 'inline-block' )
			calendar.style.display = 'inline-block';
	}.bind(this);

	//	formの位置取得
	var rect = this.m.input_elem.getBoundingClientRect();
	calendar.style.top =  Math.round(rect.top + 30) + 'px';
	calendar.style.left = Math.round(rect.left) + 'px';

	//	初期状態では非表示。update()の際には継続表示させる
	calendar.style.display = updated_ ? 'inline-block' : 'none';

	document.body.appendChild(calendar);
};

//	内部での変更をした後にこれを呼ぶ
Calendar.prototype.update = function()
{
	var calendar = document.getElementById(this.m.id_entire);
	document.body.removeChild(calendar);
	this.render(true);
};

//------------------------------------------------------------------------------
//	カレンダーの各要素の組み立て
//------------------------------------------------------------------------------

Calendar.prototype.build = function()
{
	//	カレンダー全体をdivで覆う
	var div = document.createElement('div');
	div.setAttribute('id', this.m.id_entire);
	div.classList.add(this.m.class_entire);

	var table = document.createElement('table');
	table.appendChild(this.theader());
	table.appendChild(this.header());
	table.appendChild(this.main());
	table.appendChild(this.tfoot());

	div.appendChild(table);
	return div;
};

//	1列目 << 2018 March >> の列
Calendar.prototype.theader = function()
{
	var thead = document.createElement('thead');
	var tr = document.createElement('tr');

	//	「<<」マークと、そのクリックイベント
	var laquo = document.createElement('th');
	laquo.innerHTML = '&laquo;';
	laquo.addEventListener('click', function()
	{
		this.m.display_date.setMonth(this.m.display_date.getMonth()-1);
		this.update();
	}.bind(this));
	tr.appendChild(laquo);

	//	表示中の年と月を表示
	var th = document.createElement('th');
	th.setAttribute('colspan', 5);
	th.classList.add(this.m.class_selectbox);

	//	「年」表示のプルダウンを表示させる
	var select_year = document.createElement('select');
	for(var i=0;i<10;i++)
	{
		var option = document.createElement('option');
		//	5年前から5年後までoptionとして追加する
		var value = this.m.display_date.getFullYear() - 5 + i;
		option.setAttribute('value', value);
		if( this.m.display_date.getFullYear() === value )
			option.setAttribute('selected', true);
		option.innerHTML = value;
		select_year.appendChild(option);
	}
	select_year.addEventListener('change', function()
	{
		this.m.display_date.setFullYear(select_year.value);
		this.update();
	}.bind(this));
	th.appendChild(select_year);

	var txt_year = document.createTextNode(' 年 ');
	th.appendChild(txt_year);

	//	「月」表示のプルダウンを表示させる
	var select_month = document.createElement('select');
	for(var i=1;i<=12;i++)
	{
		var option = document.createElement('option');
		option.setAttribute('value', i);
		if( this.m.display_date.getMonth()+1 === i )
			option.setAttribute('selected', true);
		option.innerHTML = i;
		select_month.appendChild(option);
	}
	select_month.addEventListener('change', function()
	{
		this.m.display_date.setDate(1);
		this.m.display_date.setMonth(select_month.value-1);
		this.update();
	}.bind(this));
	th.appendChild(select_month);

	var txt_month = document.createTextNode(' 月');
	th.appendChild(txt_month);

	tr.appendChild(th);

	//	「>>」マークと、そのクリックイベント
	var raquo = document.createElement('th');
	raquo.innerHTML = '&raquo;';
	raquo.addEventListener('click', function()
	{
		this.m.display_date.setMonth(this.m.display_date.getMonth()+1);
		this.update();
	}.bind(this));
	tr.appendChild(raquo);

	thead.appendChild(tr);
	return thead;
};

//	2列目 日曜日(Sun)から土曜日(Sat)までの列
Calendar.prototype.header = function()
{
	var tr = document.createElement('tr');

	for(var i=0;i<7;i++)
	{
		var th = document.createElement('th');
		th.textContent = this.m.week_name[i];
		th.classList.add(this.m.class_week);
		tr.appendChild(th);
	}

	var tbody = document.createElement('tbody');
	tbody.appendChild(tr);
	return tbody;
};

//	3行目以降 1日からその月の最後まで表示
Calendar.prototype.main = function()
{
	var tbody = document.createElement('tbody');
	var tr = document.createElement('tr');

	//	表示月の1日目から、1日ずつ進めていく
	var date = new Date(this.m.display_date.getTime());
	date.setDate(1);

	//	前月の日付を追加
	if(date.getDay() > 0)
	{
		var rest_days = date.getDay();
		tr.appendChild( this.restDayElems('prev', rest_days) );
	}
	var month_of_last_day = this.getLastDay(this.m.display_date);

	//	1日から最終日まで追加
	for(var i=0; i<month_of_last_day; i++)
	{
		var td = document.createElement('td');
		td.innerText = date.getDate();

		//	曜日ごとにcssのクラスを付ける
		switch(date.getDay())
		{
			case 0:
				td.classList.add(this.m.class_sunday);
				break;
			case 6:
				td.classList.add(this.m.class_saturday);
				break;
		}

		//	今日の日付にcssのクラスを追加
		var now = new Date();
		if (
			date.getYear() === now.getYear() &&
			date.getMonth() === now.getMonth() &&
			date.getDate() === now.getDate()
		)
		{
			td.classList.add(this.m.class_today);
		}

		//	既にselectedクラスが付いている場合は、それを外す
			if( this.hasClass(td, 'selected') )
				td.classList.remove('selected');

		//	selectedクラスを付ける
		if( this.m.selected_date )
		{
			if (
				date.getYear() === this.m.selected_date.getYear() &&
				date.getMonth() === this.m.selected_date.getMonth() &&
				date.getDate() === this.m.selected_date.getDate()
			)
			{
				td.classList.add('selected');
			}
		}

		//	プロパティ(from)が設定されている場合は、その日以降は選択不可になる
		if( this.m.from_date )
		{
			if ( date < this.m.from_date ) td.classList.add(this.m.class_noselect);
		}

		//	プロパティ(to)が設定されている場合は、その日以降は選択不可になる
		if( this.m.to_date )
		{
			if ( date > this.m.to_date ) td.classList.add(this.m.class_noselect);
		}

		//	選択状態にして、フォームに値を入れる
		td.addEventListener('click', function(e_)
		{
			this.onClickCalendar(e_, date);
		}.bind(this));

		tr.appendChild(td);

		//	土曜日が来たら新しいtrを作成する
		if(date.getDay() === 6)
		{
			tbody.appendChild(tr);
			tr = document.createElement('tr');
		}

		//	次の日に設定
		date.setDate(date.getDate()+1);
	}

	//	次月の日付を追加
	date.setDate(date.getDate()-1);
	if(date.getDay() !== 6)
	{
		//	土曜日になるまで繰り返す
		var rest_days = 6 - date.getDay(month_of_last_day);
		tr.appendChild( this.restDayElems('next', rest_days) );
	}
	tbody.appendChild(tr);
	return tbody;
};

//	最終行 today(今日の日付にジャンプする)の列
Calendar.prototype.tfoot = function()
{
	var tfooter = document.createElement('tfoot');
	var tr = document.createElement('tr');

	var th = document.createElement('th');
	th.setAttribute('colspan', 7);
	th.innerHTML = 'today';
	th.addEventListener('click', function()
	{
		//	今日の日付をフォームに入力
		var y, m, d, now;
		now = new Date();
		y = now.getFullYear();
		m = now.getMonth();
		d = now.getDate();
		this.inputForm({year: y, month: m, day: d});

		this.m.selected_date = new Date();
		this.m.display_date = new Date();
		this.update();
	}.bind(this));
	tr.appendChild(th);
	tfooter.appendChild(tr);

	return tfooter;
};

//------------------------------------------------------------------------------
//	前月・次月の日付を作成する
//------------------------------------------------------------------------------

Calendar.prototype.restDayElems = function( insert_timing_, loop_times_ )
{
	if( !(insert_timing_ === 'prev' || insert_timing_ === 'next') ) throw new Error();

	//	要素をまとめるためのNode
	result = document.createDocumentFragment();

	//	前の月なら最後の日から、次の月なら1日から順に追加していく
	var date = new Date(this.m.display_date.getTime());
	switch(insert_timing_)
	{
		case 'prev':
			date.setDate(0);
			break;
		case 'next':
			date.setDate(1);
			date.setMonth(date.getMonth()+1);
			break;
	}

	//	td要素をまとめていく
	while(loop_times_ > 0)
	{
		var td = document.createElement('td');
		td.innerText = date.getDate();
		td.classList.add(this.m.class_otherday);

		//	プロパティ(from)が設定されている場合は、その日以降は選択不可になる
		if( this.m.from_date )
		{
			if ( date < this.m.from_date ) td.classList.add(this.m.class_noselect);
		}

		//	プロパティ(to)が設定されている場合は、その日以降は選択不可になる
		if( this.m.to_date )
		{
			if( date > this.m.to_date ) td.classList.add(this.m.class_noselect);
		}

		td.addEventListener('click', function( e_ )
		{
			this.onClickCalendar(e_, date);
		}.bind(this));

		//	日付更新
		switch(insert_timing_)
		{
			case 'prev':
				result.insertBefore(td, result.firstChild);
				date.setDate(date.getDate()-1);
				break;
			case 'next':
				result.appendChild(td);
				date.setDate(date.getDate()+1);
				break;
		}

		loop_times_--;
	}

	return result;
};

//------------------------------------------------------------------------------
//	フォーム入力
//------------------------------------------------------------------------------

//	選択状態にして、フォームに値を入れる
Calendar.prototype.onClickCalendar = function(e_, date_, )
{
	//	選択対象外であれば無効
	if( this.hasClass(e_.target, this.m.class_noselect) ) return;

	var y = date_.getFullYear();
	var m = date_.getMonth();
	var d = e_.target.innerHTML;
	this.inputForm({year: y, month: m, day: d});

	//	別の月を選択している場合、その月に移動する
	this.m.display_date = new Date(
		date_.getFullYear(), date_.getMonth(), e_.target.innerHTML
	);
	this.m.selected_date = new Date(
		date_.getFullYear(), date_.getMonth(), e_.target.innerHTML
	);
	e_.target.classList.add('selected');

	this.update();
}

//	フォーム入力
//	形式: 2018-03-07(区切り文字'-'は自由指定)
Calendar.prototype.inputForm = function( prop_ )
{
	if( !prop_ || typeof prop_ !== 'object' ) throw new Error();

	var year = prop_.year + this.m.separator;
	var month = ('0' + (prop_.month+1)).slice(-2) + this.m.separator;
	var day = ('0' + prop_.day).slice(-2);
	this.m.input_elem.value = year + month + day;
};
//------------------------------------------------------------------------------
//	ユーティリティ
//------------------------------------------------------------------------------

//	今月末の日にちを返す
Calendar.prototype.getLastDay = function( dateobj_ )
{
	var tmp = new Date(dateobj_.getTime());
	tmp.setDate(1);
	tmp.setMonth(dateobj_.getMonth()+1);
	tmp.setDate(0);
	return tmp.getDate();
};

//	ランダムな文字列生成(一意なid設定のため)
Calendar.prototype.genString = function( length_ )
{
	var result = '';
	var char = 'abcdefghijklmnopqrstuvwxyz';
	for(var i=0;i<length_;i++)
	{
		result += char[Math.floor(Math.random()*char.length)];
	}
	return result;
};

//	Dateオブジェクトかどうかを判別する(true of false)
Calendar.prototype.isDateObj = function( date_obj_ )
{
	return Object.prototype.toString.call( date_obj_ ) === '[object Date]';
};

//	cssのクラスを持つかどうかを判別する(true or false)
Calendar.prototype.hasClass = function( elem_, class_name_ )
{
	return elem_.className.replace(/[\n\t]/g, '').indexOf(class_name_) !== -1;
};

//	値が日時に沿った値(2019-02-02など)ならdisplay_time, selected_dateに反映させる
Calendar.prototype.reflectValue = function( value_ )
{
	//	数字4つ + 任意文字0文字以上 + 数字2つ + 任意文字0文字以上 + 数字2つ
	var reg = /^[0-9]{4}.*[0-9]{2}.*[0-9]{2}$/;
	if( reg.test(value_) )
	{
		var ary = value_.match(/^([0-9]{4}).*([0-9]{2}).*([0-9]{2})$/);
		this.m.display_date = new Date(Number(ary[1]), Number(ary[2])-1, Number(ary[3]));
		this.m.selected_date = new Date(Number(ary[1]), Number(ary[2])-1, Number(ary[3]));
	}
};

//	ieにclosest()が存在しないため、以下のpollyfillのコードを流用している
//	https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
Calendar.prototype.closest = function( elem_, selector_)
{
	if (!Element.prototype.matches)
		Element.prototype.matches = Element.prototype.msMatchesSelector;

	var elem = elem_;
	do {
		if( elem.matches(selector_) ) return elem;
		elem = elem.parentElement || elem.parentNode;
	}
	while( elem !== null && elem.nodeType === 1 );

	return null;
};

//	スクロール量
Calendar.prototype.getScrollBottom = function()
{
	var body = window.document.body;
	var html = window.document.documentElement;
	var scroll_top = body.scrollTop || html.scrollTop;

	return html.scrollHeight - html.clientHeight - scroll_top;
};
//------------------------------------------------------------------------------
//	dom拡張 カレンダーを追加
//------------------------------------------------------------------------------
Element.prototype.calendar = function( props_ )
{
	if(this.tagName !== 'INPUT')
	{
		throw new Error('please use by input tag. example: document.getElementById("input-form").calendar();');
	}
	var props = props_ || {};
	props.elem = this;

	var calendar = new Calendar();
	calendar.init(props);
};

//	jQuery用
if(typeof jQuery !== undefined)
{
	//	jqueryがない場合エラーが発生するので、潰す
	try
	{
		$.fn.extend(
		{
			calendar: function( props_ )
			{
				var props = props_ || {};
				props.elem = this[0];

				var calendar = new Calendar();
				calendar.init(props);
			}
		});
	} catch(e) {};
}
