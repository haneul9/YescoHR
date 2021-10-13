this.getModel().create(
  '/GetMnlvSet',
  {
    IPernr: this._gateway.pernr(),
    IBukrs: loginInfo.Bukrs,
    ILangu: loginInfo.Langu,
    IDevice: '',
    TableIn1: [],
    TableIn2: [],
    TableIn3: [],
    TableIn4: [],
  },
  {
    async: true,
    success: function (result) {
      this._gateway.prepareLog('MenuMegaDropdown.generate ${url} success'.interpolate(url), arguments).log();

      this.items = this.getMenuTree(result);

      if (!this.items.length) {
        this.items = [{ title: '조회된 메뉴 목록이 없습니다.' }];
      }

      $(this.parentSelector).html(
        this.ul.replace(
          /\$\{[^{}]*\}/,
          $.map(
            this.items,
            function (top) {
              return this.topMenuItem(top);
            }.bind(this)
          ).join('')
        )
      );

      if (reload) {
        return;
      }

      $(document).on('click', this.parentSelector + ' .dropdown-menu', function (e) {
        e.stopImmediatePropagation();
      });
      $(document).on('click', this.parentSelector + ' a[data-url]', this.handleUrl.bind(this));
      $(document).on('mouseover', this.parentSelector + ' .has-mega-menu', function (e) {
        var li = $(e.currentTarget),
          offsetTop = li.offset().top - li.parent().offset().top;
        li.find('.mega-menu')
          .toggleClass('d-block', true)
          .css({
            top: offsetTop + li.height() + 'px',
            maxHeight: 'calc(100vh - ' + $('.ehr-header').height() + 'px - 1rem)',
          });
      });
      $(document).on('mouseout', this.parentSelector + ' .has-mega-menu', function (e) {
        $(e.currentTarget).find('.mega-menu').toggleClass('d-block', false);
      });

      setTimeout(function () {
        $('.ehr-header .menu-spinner-wrapper').toggleClass('d-none', true);
      }, 0);

      resolve({ data: result });
    }.bind(this),
    error: function (jqXHR) {
      var message = this._gateway.handleError(this._gateway.ODataDestination.S4HANA, jqXHR, 'MenuMegaDropdown.generate ' + url).message;

      this.items = [{ title: '조회된 메뉴 목록이 없습니다.' }];
      $(this.parentSelector).html(
        this.ul.replace(
          /\$\{[^{}]*\}/,
          $.map(
            this.items,
            function (top) {
              return this.topMenuItem(top);
            }.bind(this)
          ).join('')
        )
      );

      this._gateway.alert({
        title: '오류',
        html: ['<p>메뉴를 조회하지 못했습니다.', '화면을 새로고침 해주세요.<br />', '같은 문제가 반복될 경우 HR 시스템 담당자에게 문의하세요.', '시스템 오류 메세지 : ' + message, '</p>'].join(
          '<br />'
        ),
      });

      setTimeout(function () {
        $('.ehr-header .menu-spinner-wrapper').toggleClass('d-none', true);
      }, 0);

      reject(jqXHR);
    }.bind(this),
  }
);
