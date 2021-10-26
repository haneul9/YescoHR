sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/control/HomeMenuLevel1',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    HomeMenuLevel1,
    AppUtils
  ) => {
    'use strict';
    class HomeMenu {
      constructor(oController, bTestMode) {
        this.oController = oController;
        this.oMenuPopover = null;
        this.mMenuUrl = null;
        this.mMenuProperties = null;
        this.aMenuFavorites = null;

        if (bTestMode === true) {
          this.aMenuLevel4Test = [
            {
              Pinfo: 'X',
              Menid: '7110',
              Mnurl: 'components',
              Mentx: '인사 3',
            },
            {
              Pinfo: 'X',
              Menid: '7210',
              Mnurl: 'https://www.google.co.kr',
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
              Pwchk: '',
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
              Pwchk: '',
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

              this.buildHomeMenu(oData).then(() => {
                AppUtils.setAppBusy(false, this.oController);
              });
            },
            error: (oError) => {
              this.oController.debug(`${sUrl} error.`, oError);

              this.buildHomeMenu().then(() => {
                AppUtils.setAppBusy(false, this.oController);
              });
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
        (this.aMenuLevel4Test || aMenuLevel4).map(({ Mnurl, Menid, Phead }) => {
          this.mMenuUrl[Mnurl] = Menid;
          this.mMenuProperties[Menid] = { Menid, Mnurl, Phead };
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
          mMenuProperty.Pwchk = m.Pwchk === 'X';

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
            Mnurl: !m.Menid ? '' : (this.mMenuProperties[m.Menid] || {}).Mnurl || '',
            Mepop: m.Mepop === 'X',
            Favor: m.Favor === 'X',
            Pwchk: m.Pwchk === 'X',
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
            Mnurl: !m.Menid ? '' : (this.mMenuProperties[m.Menid] || {}).Mnurl || '',
            Mepop: m.Mepop === 'X',
            Favor: m.Favor === 'X',
            Pwchk: m.Pwchk === 'X',
            Children: mLevel1SubMenu[m.Mnid1] || [],
            StyleClasses: m.Mnid1 === '70000' ? 'menu-mss' : m.Mnid1 === '80000' ? 'menu-hass' : '',
          };
        });
      }

      openMenuPopoverBy(oMenuButton) {
        // 메뉴에 mouseover evet 발생시 mouseover 스타일 적용, 다른 메뉴의 mouseover 스타일 제거
        setTimeout(() => {
          const $MenuButton = oMenuButton.$();
          $MenuButton.toggleClass('home-menu-level1-hover', true);
          $MenuButton.siblings().toggleClass('home-menu-level1-hover', false);
        }, 0);

        if (!this.oMenuPopover) {
          Fragment.load({
            name: 'sap.ui.yesco.fragment.HomeMenuPopover',
            controller: this,
          }).then((oPopover) => {
            this.oMenuPopover = oPopover;
            this.oMenuPopover
              .attachBeforeClose(function (oEvent) {
                const $MenuButton = oEvent.getParameter('openBy').$();
                setTimeout(() => {
                  $MenuButton.toggleClass('home-menu-level1-hover', false);
                  $MenuButton.siblings().toggleClass('home-menu-level1-hover', false);
                }, 0);
              })
              .attachAfterClose(function () {
                this.setModel(null);
              })
              .setModel(oMenuButton.getModel())
              .openBy(oMenuButton);
          });
        } else {
          if (!this.oMenuPopover.isOpen()) {
            this.oMenuPopover.setModel(oMenuButton.getModel()).openBy(oMenuButton);
          } else {
            this.oMenuPopover.setModel(oMenuButton.getModel());
          }
        }
      }

      closeMenuPopover() {
        if (this.oMenuPopover && this.oMenuPopover.isOpen()) {
          this.oMenuPopover.close();
        }
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

      formatMenuUrl(Mnurl, Mepop) {
        if (/^https?:/.test(Mnurl)) {
          return Mnurl;
        }
        if (/^javascript:/.test(Mnurl)) {
          return Mnurl;
        }
        return `${location.origin}${location.pathname}#/${(Mnurl || '').replace(/^\/+/, '')}`;
      }

      /**
       * 메뉴 링크 클릭 이벤트 처리
       * @param {*} oEvent
       */
      handleMenuLink(oEvent) {
        oEvent.preventDefault();

        this.closeMenuPopover();

        const oContext = oEvent.getSource().getBindingContext();
        if (!oContext.getProperty('Mepop')) {
          AppUtils.setAppBusy(true, this.oController);

          const oCommonModel = this.oController.getModel(/* ZHR_COMMON_SRV */);
          const sUrl = oCommonModel.createKey('/GetMenuUrlSet', {
            Menid: oContext.getProperty('Menid'),
          });

          oCommonModel.read(sUrl, {
            success: (oData, oResponse) => {
              this.oController.debug(`${sUrl} success.`, oData, oResponse);

              oData.Mnurl = 'commonComponents'; // TODO remove

              if (oData.Mnurl) {
                this.oController.getRouter().navTo(oData.Mnurl);
              } else {
                MessageBox.error(
                  this.oController.getText('MSG_01003'), // 메뉴 오류입니다.
                  {
                    onClose: () => {
                      AppUtils.setAppBusy(false, this.oController);
                    },
                  }
                );
              }
            },
            error: (oError) => {
              this.oController.debug(`${sUrl} error.`, oError);

              MessageBox.error(
                this.oController.getText('MSG_01003'), // 메뉴 오류입니다.
                {
                  onClose: () => {
                    AppUtils.setAppBusy(false, this.oController);
                  },
                }
              );
            },
          });
        }
      }
    }

    return HomeMenu;
  }
);
