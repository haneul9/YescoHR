sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/control/HomeMenuLevel1',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    HomeMenuLevel1
  ) => {
    'use strict';
    class HomeMenu {
      constructor(oController, bTestMode) {
        this.oController = oController;
        this.mMenuUrl = null;
        this.mMenuProperties = null;
        this.aMenuFavorites = null;

        if (bTestMode === true) {
          this.aMenuLevel4Test = [
            {
              Pinfo: 'X',
              Menid: '7110',
              Meurl: 'components',
              Mentx: '인사 3',
            },
            {
              Pinfo: 'X',
              Menid: '7210',
              Meurl: 'https://www.google.co.kr',
              Mentx: '인사 3',
            },
          ];
          this.aMenuLevel3Test = [
            {
              Mnid1: '70000',
              Mnid2: '71000',
              Mnid3: '7110',
              Mnnm3: '인사 3',
              Mnsrt: '001',
              Menid: '7110',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              CheckPw: '',
              Favor: 'X',
            },
            {
              Mnid1: '70000',
              Mnid2: '72000',
              Mnid3: '7210',
              Mnnm3: '근태 3',
              Mnsrt: '002',
              Menid: '7210',
              Mepop: 'X',
              Device: 'A',
              Mnetc: '',
              CheckPw: '',
              Favor: '',
            },
          ];
        }

        this.retrieveMenu();
      }

      retrieveMenu() {
        const sUrl = '/GetMenuLvSet';
        this.oController.getModel(/* ZHR_COMMON_SRV */).create(
          sUrl,
          {
            Pernr: '50007',
            Werks: '1000',
            Rolid: '',
            Langu: '',
            Device: '',
            GetMenuLv1Nav: [],
            GetMenuLv2Nav: [],
            GetMenuLv3Nav: [],
            GetMenuLv4Nav: [],
          },
          {
            success: (oData, oResponse) => {
              this.oController.debug(`${sUrl} success.`, oData, oResponse);

              this.buildHomeMenu(oData).then(this.oController.setAppNotBusy.bind(this.oController));
            },
            error: (oError) => {
              this.oController.debug(`${sUrl} error.`, oError);

              this.buildHomeMenu().then(this.oController.setAppNotBusy.bind(this.oController));
            },
          }
        );
      }

      /**
       * 메뉴 구성
       * @param {*} mMenuRawData
       * @returns
       */
      buildHomeMenu(mMenuRawData = {}) {
        return new Promise((resolve) => {
          const aMenuTree = this.getMenuTree(mMenuRawData);
          const oHomeMenuToolbar = this.oController.byId('homeMenuToolbar');

          if (!aMenuTree.length) {
            oHomeMenuToolbar.insertContent(new Label({ text: '{i18n>MSG_01001}' }), 2); // 조회된 메뉴가 없습니다.
            resolve();
            return;
          }

          // Home menu 생성
          aMenuTree.forEach((mMenu, i) => {
            oHomeMenuToolbar.insertContent(new HomeMenuLevel1(mMenu, this), i + 2); // Home logo, ToolbarSpacer 이후부터 menu 추가
          });

          resolve();
        });
      }

      /**
       * 메뉴 tree 정보 생성
       * @param {*} param0
       * @returns
       */
      getMenuTree({ GetMenuLv1Nav = {}, GetMenuLv2Nav = {}, GetMenuLv3Nav = {}, GetMenuLv4Nav = {} }) {
        const { results: aMenuLevel1 = [] } = GetMenuLv1Nav;
        const { results: aMenuLevel2 = [] } = GetMenuLv2Nav;
        const { results: aMenuLevel3 = [] } = GetMenuLv3Nav;
        const { results: aMenuLevel4 = [] } = GetMenuLv4Nav;

        const mLevel1SubMenu = {};
        const mLevel2SubMenu = {};

        this.mMenuUrl = {};
        this.mMenuProperties = {};
        this.aMenuFavorites = [];

        // 각 메뉴 속성 정리
        (this.aMenuLevel4Test || aMenuLevel4).map(({ Meurl, Menid, Pinfo }) => {
          this.mMenuUrl[Meurl] = Menid;
          this.mMenuProperties[Menid] = { Menid, Meurl, Pinfo };
        });

        // 3rd level 메뉴 속성 정리
        (this.aMenuLevel3Test || aMenuLevel3).map((m) => {
          if (m.Hide === 'X') {
            return;
          }
          if (m.Favor === 'X') {
            this.aMenuFavorites.push(m.Menid);
          }

          const mMenuProperty = this.mMenuProperties[m.Menid] || {};
          mMenuProperty.Mname = m.Mnnm3;
          mMenuProperty.Mnid1 = m.Mnid1;
          mMenuProperty.Mnid2 = m.Mnid2;
          mMenuProperty.Mnid3 = m.Mnid3;
          mMenuProperty.Mepop = m.Mepop === 'X';
          mMenuProperty.Favor = m.Favor === 'X';
          mMenuProperty.CheckPw = m.CheckPw === 'X';

          const aLevel2SubMenu = mLevel2SubMenu[m.Mnid2];
          if (aLevel2SubMenu) {
            aLevel2SubMenu.push(mMenuProperty);
          } else {
            mLevel2SubMenu[m.Mnid2] = [mMenuProperty];
          }
        });

        // 2nd level 메뉴 속성 정리
        aMenuLevel2.map((m) => {
          if (m.Hide === 'X') {
            return;
          }
          if (m.Favor === 'X') {
            this.aMenuFavorites.push(m.Menid);
          }

          const mMenuProperty = {
            Menid: m.Menid,
            Mnid2: m.Mnid2,
            Mname: m.Mnnm2,
            Meurl: !m.Menid ? '' : (this.mMenuProperties[m.Menid] || {}).Meurl || '',
            Mepop: m.Mepop === 'X',
            Favor: m.Favor === 'X',
            CheckPw: m.CheckPw === 'X',
            Children: mLevel2SubMenu[m.Mnid2] || [],
          };
          const aLevel1SubMenu = mLevel1SubMenu[m.Mnid1];
          if (aLevel1SubMenu) {
            aLevel1SubMenu.push(mMenuProperty);
          } else {
            mLevel1SubMenu[m.Mnid1] = [mMenuProperty];
          }
        });

        // Top level 메뉴 속성 정리
        return aMenuLevel1.map((m) => {
          if (m.Hide === 'X') {
            return;
          }
          if (m.Favor === 'X') {
            this.aMenuFavorites.push(m.Menid);
          }
          return {
            Menid: m.Menid,
            Mnid1: m.Mnid1,
            Mname: m.Mnnm1,
            Meurl: !m.Menid ? '' : (this.mMenuProperties[m.Menid] || {}).Meurl || '',
            Mepop: m.Mepop === 'X',
            Favor: m.Favor === 'X',
            CheckPw: m.CheckPw === 'X',
            Children: mLevel1SubMenu[m.Mnid1] || [],
            StyleClasses: m.Mnid1 === '70000' ? 'menu-mss' : m.Mnid1 === '80000' ? 'menu-hass' : '',
          };
        });
      }

      /**
       * 메뉴의 즐겨찾기 클릭 이벤트 처리
       * @param {*} oEvent
       */
      toggleFavorite(oEvent) {
        const oEventSource = oEvent.getSource();
        const oContext = oEventSource.getBindingContext();
        const bFavor = oContext.getProperty('Favor');
        const sUrl = '/MenuFavoriteSet';

        this.oController.getModel(/* ZHR_COMMON_SRV */).create(
          sUrl,
          {
            Menid: oContext.getProperty('Menid'),
            Mnid1: oContext.getProperty('Mnid1'),
            Mnid2: oContext.getProperty('Mnid2'),
            Mnid3: oContext.getProperty('Mnid3'),
            Favor: bFavor ? '' : 'X',
          },
          {
            success: (oData, oResponse) => {
              this.oController.debug(`${sUrl} success.`, oData, oResponse);

              oContext.getModel().setProperty(`${oContext.getPath()}/Favor`, bFavor ? '' : 'X');
              oEventSource.setSrc(bFavor ? 'sap-icon://unfavorite' : 'sap-icon://favorite');
            },
            error: (oError) => {
              this.oController.debug(`${sUrl} error.`, oError);

              MessageBox.error(this.oController.getText('MSG_00008', 'MSG_01002')); // {즐겨찾기 수정}중 오류가 발생하였습니다.
            },
          }
        );
      }

      /**
       * 메뉴 링크 클릭 이벤트 처리
       * @param {*} oEvent
       */
      handleMenuLink(oEvent) {
        if (!oEvent.getSource().getBindingContext().getProperty('Mepop')) {
          // this.oController.getViewModel('appView').setProperty('/busy', true);
        }
      }
    }

    return HomeMenu;
  }
);
