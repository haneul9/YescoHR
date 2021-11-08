sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Label',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/control/app/MenuLevel1',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Label,
    Fragment,
    MessageBox,
    MenuLevel1,
    AppUtils,
    ServiceNames
  ) => {
    'use strict';

    class Menus {
      constructor(oAppController) {
        this.oAppController = oAppController;
        this.oMenuPopover = null;
        this.mMenuUrl = null;
        this.mMenuProperties = null;
        this.aMenuFavorites = null;

        this.retrieveMenu();
      }

      /**
       * 메뉴 정보 조회 및 메뉴 생성
       */
      retrieveMenu() {
        const sUrl = '/GetMenuLvSet';
        this.oAppController.getModel(ServiceNames.COMMON).create(
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
              this.debug(`${sUrl} success.`, oData, oResponse);

              this.buildAppMenu(oData).then(() => {
                AppUtils.setMenuBusy(false, this.oAppController);
              });
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              this.buildAppMenu().then(() => {
                AppUtils.setMenuBusy(false, this.oAppController);
              });
            },
          }
        );
      }

      /**
       * 메뉴 생성
       * @param {map} mMenuRawData OData 조회 메뉴 정보
       * @returns {promise} 메뉴 생성 완료 대기 promise
       */
      buildAppMenu(mMenuRawData = {}) {
        return new Promise((resolve) => {
          const aMenuTree = this.getMenuTree(mMenuRawData);
          const oAppMenuToolbar = this.oAppController.byId('appMenuToolbar');

          if (!aMenuTree.length) {
            oAppMenuToolbar.insertContent(new Label({ text: '{i18n>MSG_01001}' }), 2); // 조회된 메뉴가 없습니다.
            resolve();
            return;
          }

          // App menu 생성
          aMenuTree.forEach((mMenu, i) => {
            oAppMenuToolbar.insertContent(new MenuLevel1(mMenu, this), i + 2); // App logo, ToolbarSpacer 이후부터 menu 추가
          });

          resolve();
        });
      }

      /**
       * 메뉴 tree 정보 생성
       * @param {map} GetMenuLv1Nav 1 level 메뉴 정보
       * @param {map} GetMenuLv2Nav 2 level 메뉴 정보
       * @param {map} GetMenuLv3Nav 3 level 메뉴 정보
       * @param {map} GetMenuLv4Nav 메뉴 속성 정보
       * @returns {array} 메뉴 tree 정보
       */
      getMenuTree({ GetMenuLv1Nav = {}, GetMenuLv2Nav = {}, GetMenuLv3Nav = {}, GetMenuLv4Nav = {} }) {
        const { results: aMenuLevel1 = [] } = GetMenuLv1Nav;
        const { results: aMenuLevel2 = [] } = GetMenuLv2Nav;
        const { results: aMenuLevel3 = [] } = GetMenuLv3Nav;
        const { results: aMenuLevel4 = [] } = GetMenuLv4Nav;

        const mLevel1SubMenu = {};
        const mLevel2SubMenu = {};
        const bIsLocal = /^localhost/.test(location.hostname);
        const bIsDev = /^yeshrsapdev/.test(location.hostname);

        this.mMenuUrl = {};
        this.mMenuProperties = {};
        this.aMenuFavorites = [];

        // 개발자 PC || 개발 서버 : 샘플 메뉴 정보 추가
        if (bIsLocal || bIsDev) {
          this.appendSampleMenu({ aMenuLevel1, aMenuLevel2, aMenuLevel3, aMenuLevel4 });
        }

        // 각 메뉴 속성 정리
        aMenuLevel4.map(({ Mnurl, Menid, Phead }) => {
          this.mMenuUrl[Mnurl] = Menid;
          this.mMenuProperties[Menid] = { Menid, Mnurl, Phead };
        });

        // 3rd level 메뉴 속성 정리
        aMenuLevel3.map((m) => {
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

      appendSampleMenu({ aMenuLevel1, aMenuLevel2, aMenuLevel3, aMenuLevel4 }) {
        aMenuLevel4.splice(
          ...[
            aMenuLevel4.length,
            0,
            {
              Pinfo: '',
              Menid: 'X110',
              Mnurl: 'sampleComponents',
              Mentx: '퍼블용 컴포넌트',
            },
            {
              Pinfo: '',
              Menid: 'X120',
              Mnurl: 'sampleTimeline',
              Mentx: 'Timeline sample',
            },
            {
              Pinfo: '',
              Menid: 'X130',
              Mnurl: 'sampleNinebox',
              Mentx: '9 Box Model',
            },
            {
              Pinfo: '',
              Menid: 'X140',
              Mnurl: 'sampleDonutChart',
              Mentx: 'Donut Chart',
            },
            {
              Pinfo: '',
              Menid: 'X210',
              Mnurl: 'https://www.google.co.kr',
              Mentx: '구글',
            },
            {
              Pinfo: '',
              Menid: 'X220',
              Mnurl: 'congratulation',
              Mentx: '경조금',
            },
          ]
        );

        aMenuLevel3.splice(
          ...[
            aMenuLevel3.length,
            0,
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X110',
              Mnnm3: '퍼블용 컴포넌트',
              Mnsrt: '001',
              Menid: 'X110',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: 'X',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X120',
              Mnnm3: 'Timeline',
              Mnsrt: '002',
              Menid: 'X120',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X130',
              Mnnm3: '9 Box Model',
              Mnsrt: '003',
              Menid: 'X130',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X140',
              Mnnm3: 'Donut Chart',
              Mnsrt: '004',
              Menid: 'X140',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X2000',
              Mnid3: 'X210',
              Mnnm3: '구글',
              Mnsrt: '001',
              Menid: 'X210',
              Mepop: 'X',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X2000',
              Mnid3: 'X220',
              Mnnm3: '경조금',
              Mnsrt: '002',
              Menid: 'X220',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
          ]
        );

        aMenuLevel2.splice(
          ...[
            aMenuLevel2.length,
            0,
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnnm2: '샘플 1',
              Mnsrt: '001',
              Menid: 'X100',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X2000',
              Mnnm2: '샘플 2',
              Mnsrt: '002',
              Menid: 'X200',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
          ]
        );

        aMenuLevel1.splice(
          ...[
            aMenuLevel1.length,
            0,
            {
              Mnid1: 'X0000',
              Mnnm1: 'Samples',
              Mnsrt: '999',
              Menid: 'X000',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
            },
          ]
        );
      }

      /**
       * Top 메뉴 mouseover에 의한 popover 열기
       * @param {object} oMenuButton
       */
      openMenuPopoverBy(oMenuButton) {
        // 메뉴에 mouseover evet 발생시 mouseover 스타일 적용, 다른 메뉴의 mouseover 스타일 제거
        setTimeout(() => {
          const $MenuButton = oMenuButton.$();
          $MenuButton.toggleClass('app-menu-level1-hover', true);
          $MenuButton.siblings().toggleClass('app-menu-level1-hover', false);
        }, 0);

        if (!this.oMenuPopover) {
          Fragment.load({
            name: 'sap.ui.yesco.fragment.app.MenuPopover',
            controller: this,
          }).then((oPopover) => {
            this.oMenuPopover = oPopover;
            this.oMenuPopover
              .attachBeforeClose((oEvent) => {
                const $MenuButton = oEvent.getParameter('openBy').$();
                setTimeout(() => {
                  $MenuButton.toggleClass('app-menu-level1-hover', false);
                  $MenuButton.siblings().toggleClass('app-menu-level1-hover', false);
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

      /**
       * 메뉴 popover 닫기
       */
      closeMenuPopover() {
        if (this.oMenuPopover && this.oMenuPopover.isOpen()) {
          this.oMenuPopover.close();
        }
      }

      /**
       * 메뉴의 즐겨찾기 클릭 이벤트 처리
       * @param {object} oEvent
       */
      toggleFavorite(oEvent) {
        const oEventSource = oEvent.getSource();
        const oContext = oEventSource.getBindingContext();
        const bFavor = oContext.getProperty('Favor');
        const sUrl = '/MenuFavoriteSet';

        this.oAppController.getModel(ServiceNames.COMMON).create(
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
              this.debug(`${sUrl} success.`, oData, oResponse);

              oContext.getModel().setProperty(`${oContext.getPath()}/Favor`, bFavor ? '' : 'X');
              oEventSource.setSrc(bFavor ? 'sap-icon://unfavorite' : 'sap-icon://favorite');

              // TODO : 즐겨찾기 portlet 갱신
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              MessageBox.error(this.oAppController.getText('MSG_00008', 'MSG_01002')); // {즐겨찾기 수정}중 오류가 발생하였습니다.
            },
          }
        );
      }

      /**
       *
       * @param {string} sMnurl 메뉴 URL
       * @param {boolean} bMepop popup 메뉴 여부
       * @returns {string} anchor href 속성값
       */
      // eslint-disable-next-line no-unused-vars
      formatMenuUrl(sMnurl, bMepop) {
        if (/^https?:/.test(sMnurl)) {
          return sMnurl;
        }
        if (/^javascript:/.test(sMnurl)) {
          return sMnurl;
        }
        return 'javascript:;'; // Routing URL 노출을 막기위해 anchor의 href 속성에서 URL을 제거
        // return `${location.origin}${location.pathname}#/${(Mnurl || '').replace(/^\/+/, '')}`;
      }

      /**
       *
       * @param {string} sMnurl 메뉴 URL
       * @param {boolean} bMepop popup 메뉴 여부
       * @returns {string} anchor target 속성값
       */
      // eslint-disable-next-line no-unused-vars
      formatMenuTarget(sMnurl, bMepop) {
        if (/^https?:/.test(sMnurl)) {
          return '_blank';
        }
        return '_self';
      }

      /**
       * 메뉴 link click event 처리
       *  - http|https|javascript로 시작되는 경우에는 anchor 본연의 link 기능으로 동작함
       * @param {object} oEvent
       */
      handleMenuLink(oEvent) {
        oEvent.preventDefault();

        this.closeMenuPopover();

        const oContext = oEvent.getSource().getBindingContext();
        if (oContext.getProperty('Mepop')) {
          return;
        }

        AppUtils.setAppBusy(true, this.oAppController).setMenuBusy(true, this.oAppController);

        const sMenid = oContext.getProperty('Menid');
        if (/^X/.test(sMenid)) {
          this.moveToMenu(this.mMenuProperties[sMenid].Mnurl);
          return;
        }

        const oCommonModel = this.oAppController.getModel(ServiceNames.COMMON);
        const sUrl = oCommonModel.createKey('/GetMenuUrlSet', {
          Menid: sMenid,
        });

        oCommonModel.read(sUrl, {
          success: (oData, oResponse) => {
            this.debug(`${sUrl} success.`, oData, oResponse);

            if (oData.Mnurl) {
              this.moveToMenu(oData.Mnurl);
            } else {
              this.failMenuLink();
            }
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);

            this.failMenuLink();
          },
        });
      }

      failMenuLink() {
        MessageBox.error(
          this.oAppController.getText('MSG_01003'), // 메뉴 오류입니다.
          {
            onClose: () => {
              AppUtils.setAppBusy(false, this.oAppController).setMenuBusy(false, this.oAppController);
            },
          }
        );
      }

      moveToMenu(sMenuUrl) {
        this.oAppController;
        this.oAppController.getRouter().navTo(sMenuUrl);
        // this.oAppController
        //   .getRouter()
        //   .getTargets()
        //   .display(sMenuUrl)
        //   .then(() => {
        //     AppUtils.setAppBusy(false, this.oAppController).setMenuBusy(false, this.oAppController);
        //   });
      }

      debug(...args) {
        this.oAppController.debug(...args);
      }
    }

    return Menus;
  }
);
