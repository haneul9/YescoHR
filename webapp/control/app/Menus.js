sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Label',
    'sap/ui/core/Fragment',
    'sap/ui/core/routing/HashChanger',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/control/app/MenuLevel1',
  ],
  (
    // prettier 방지용 주석
    Label,
    Fragment,
    HashChanger,
    JSONModel,
    AppUtils,
    ServiceNames,
    MessageBox,
    MenuLevel1
  ) => {
    'use strict';

    class Menus {
      constructor(oController) {
        this.oController = oController;
        this.oMenuPopover = null;
        this.oMenuModel = this.oController.getOwnerComponent().getMenuModel();

        this.buildAppMenu();
      }

      /**
       * 메뉴 생성
       */
      async buildAppMenu() {
        await this.oMenuModel.getPromise();

        const aMenuTree = this.oMenuModel.getTree() || [];
        const oAppMenuToolbar = this.oController.byId('appMenuToolbar');

        if (!aMenuTree.length) {
          oAppMenuToolbar.insertContent(new Label({ text: '{i18n>MSG_01001}' }), 2); // 조회된 메뉴가 없습니다.
          return;
        }

        // App menu 생성
        aMenuTree.forEach((mMenu, i) => {
          oAppMenuToolbar.insertContent(
            new MenuLevel1({
              text: mMenu.Mname,
              tooltip: `${mMenu.Mname} (${mMenu.Mnid1}:${mMenu.Menid})`,
            })
              .addStyleClass(mMenu.StyleClasses)
              .setAppMenu(this)
              .setModel(new JSONModel(mMenu)),
            i + 2 // App logo, ToolbarSpacer 이후부터 menu 추가
          );
        });

        AppUtils.setMenuBusy(false);
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
          this.oMenuPopover.setModel(oMenuButton.getModel());
          if (!this.oMenuPopover.isOpen()) {
            this.oMenuPopover.openBy(oMenuButton);
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

        this.oController.getModel(ServiceNames.COMMON).create(
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

              MessageBox.error(this.oController.getText('MSG_00008', 'MSG_01002')); // {즐겨찾기 수정}중 오류가 발생하였습니다.
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
        // return `${location.origin}${location.pathname}#/${(sMnurl || '').replace(/^\/+/, '')}`;
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

        AppUtils.setAppBusy(true).setMenuBusy(true);

        const sMenid = oContext.getProperty('Menid');
        if (/^X/.test(sMenid)) {
          const sMnurl = (this.oMenuModel.getProperties(sMenid) || {}).Mnurl || '';
          this.moveToMenu(sMnurl);
          return;
        }

        const oCommonModel = this.oController.getModel(ServiceNames.COMMON);
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
          this.oController.getText('MSG_01003'), // 메뉴 오류입니다.
          {
            onClose: () => {
              AppUtils.setAppBusy(false).setMenuBusy(false);
            },
          }
        );
      }

      moveToMenu(sRouteName) {
        // 같은 메뉴 클릭시
        if (HashChanger.getInstance().getHash() === sRouteName) {
          AppUtils.setAppBusy(false).setMenuBusy(false);
          return;
        }

        this.oController.getRouter().navTo(sRouteName);
        // this.oController
        //   .getRouter()
        //   .getTargets()
        //   .display(sRouteName)
        //   .then(() => {
        //     AppUtils.setAppBusy(false).setMenuBusy(false);
        //   });
      }

      debug(...args) {
        this.oController.debug(...args);
      }
    }

    return Menus;
  }
);
