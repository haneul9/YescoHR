sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Label',
    'sap/ui/base/Object',
    'sap/ui/core/CustomData',
    'sap/ui/core/Fragment',
    'sap/ui/core/routing/HashChanger',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/app/control/MenuLevel1',
  ],
  (
    // prettier 방지용 주석
    Label,
    BaseObject,
    CustomData,
    Fragment,
    HashChanger,
    JSONModel,
    AppUtils,
    Client,
    ServiceNames,
    MessageBox,
    MenuLevel1
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.mvc.controller.app.control.Menus', {
      constructor: function (oAppController) {
        this.oAppController = oAppController;
        this.oMenuButton = null;
        this.oMenuLayer = null;
        this.oMenuModel = this.oAppController.getOwnerComponent().getMenuModel();

        this.buildAppMenu();
      },

      /**
       * 메뉴 생성
       */
      async buildAppMenu() {
        await this.oMenuModel.getPromise();

        const aMenuTree = this.oMenuModel.getTree() || [];
        const oAppMenuToolbar = this.oAppController.byId('appMenuToolbar');

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
              customData: new CustomData({ key: 'Mnid1', value: mMenu.Mnid1 }),
            })
            .addStyleClass(mMenu.StyleClasses)
            .setAppMenu(this),
            i + 2 // App logo, ToolbarSpacer 이후부터 menu 추가
          );
        });

        AppUtils.setMenuBusy(false);
      },

      /**
       * Top 메뉴 mouseover에 의한 popover 열기
       * @param {object} oMenuButton
       */
      async openMenuLayer(oMenuButton) {
        this.oMenuButton = oMenuButton;

        this.toggleSelectedMenuStyle(true);

        if (!this.oMenuLayer) {
          this.oMenuLayer = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.app.fragment.MegadropMenu',
            controller: this,
          });

          this.oMenuLayer.setAppMenu(this);
          this.oMenuLayer.setModel(this.oMenuModel);
          this.oMenuLayer.placeAt('sap-ui-static');
        }

        console.log(oMenuButton.data('Mnid1'));
        console.log(this.oMenuModel.getProperty(oMenuButton.data('Mnid1')));
        this.oMenuModel.setProperty('/Children', this.oMenuModel.getProperty(oMenuButton.data('Mnid1')).Children);
        // this.oMenuLayer.setModel(oMenuButton.getModel());

        if (!this.oMenuLayer.getVisible()) {
          this.oMenuLayer.setVisible(true);
        }
      },

      toggleSelectedMenuStyle(bOnHoverStyle) {
        // 메뉴에 mouseover event 발생시 mouseover 스타일 적용, 다른 메뉴의 mouseover 스타일 제거
        setTimeout(() => {
          if (this.oMenuButton) {
            const $MenuButton = this.oMenuButton.$();
            $MenuButton.toggleClass('app-menu-level1-hover', bOnHoverStyle);
            $MenuButton.siblings().toggleClass('app-menu-level1-hover', false);
          }
        });
      },

      /**
       * 메뉴 popover 닫기
       */
      closeMenuLayer(bByMenuClick = false) {
        setTimeout(() => {
          if (!bByMenuClick) {
            this.toggleSelectedMenuStyle(false);
          }
          if (this.oMenuLayer && this.oMenuLayer.getVisible()) {
            this.oMenuLayer.setVisible(false);
          }
        });
      },

      /**
       * 메뉴의 즐겨찾기 클릭 이벤트 처리
       * @param {object} oEvent
       */
      async toggleFavorite(oEvent) {
        try {
          const oEventSource = oEvent.getSource();
          const oContext = oEventSource.getBindingContext();
          const oContextModel = oContext.getModel();
          const sPath = oContext.getPath();
          const sMenid = oContext.getProperty('Menid');
          const bToBeUnfavorite = oContext.getProperty('Favor');

          const oCommonModel = this.oAppController.getModel(ServiceNames.COMMON);
          const sUrl = 'PortletFavoriteMenu';
          const mPayload = {
            Menid: sMenid,
            Mnid1: oContext.getProperty('Mnid1'),
            Mnid2: oContext.getProperty('Mnid2'),
            Mnid3: oContext.getProperty('Mnid3'),
          };

          if (bToBeUnfavorite) {
            await Client.remove(oCommonModel, sUrl, mPayload);

            oContextModel.setProperty(`${sPath}/Favor`, false);
            oContextModel.setProperty(`${sPath}/Icon`, 'sap-icon://unfavorite');

            this.oMenuModel.removeFavoriteMenus(sMenid);
          } else {
            await Client.create(oCommonModel, sUrl, mPayload);

            oContextModel.setProperty(`${sPath}/Favor`, true);
            oContextModel.setProperty(`${sPath}/Icon`, 'sap-icon://favorite');

            this.oMenuModel.addFavoriteMenus(sMenid);
          }

          return true;
        } catch (oError) {
          MessageBox.error(AppUtils.getBundleText('MSG_00008', 'MSG_01002')); // {즐겨찾기 수정}중 오류가 발생하였습니다.

          return false;
        }
      },

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
      },

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
      },

      /**
       * 메뉴 link click event 처리
       *  - http|https|javascript로 시작되는 경우에는 anchor 본연의 link 기능으로 동작함
       * @param {object} oEvent
       */
      async handleMenuLink(oEvent) {
        oEvent.preventDefault();

        setTimeout(() => {
          this.closeMenuLayer(true);
        });

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

        try {
          const oCommonModel = this.oAppController.getModel(ServiceNames.COMMON);
          const sUrl = 'GetMenuUrl';
          const mKeyMap = {
            Menid: sMenid,
          };

          const mData = await Client.get(oCommonModel, sUrl, mKeyMap);
          if (mData.Mnurl) {
            this.moveToMenu(mData.Mnurl);
          } else {
            this.failMenuLink();
          }
        } catch (oError) {
          this.failMenuLink();
        }
      },

      failMenuLink() {
        MessageBox.error(
          AppUtils.getBundleText('MSG_01003'), // 메뉴 오류입니다.
          {
            onClose: () => {
              AppUtils.setAppBusy(false).setMenuBusy(false);
            },
          }
        );
      },

      moveToMenu(sRouteName) {
        // 같은 메뉴 클릭시
        if (HashChanger.getInstance().getHash() === sRouteName) {
          AppUtils.setAppBusy(false).setMenuBusy(false);
          return;
        }

        const oUIComponent = this.oAppController.getOwnerComponent();
        oUIComponent.reduceViewResource(); // 메뉴 이동 전 View hidden 처리로 불필요한 DOM 정보를 제거
        oUIComponent.getRouter().navTo(sRouteName);
        // this.oAppController
        //   .getRouter()
        //   .getTargets()
        //   .display(sRouteName)
        //   .then(() => {
        //     AppUtils.setAppBusy(false).setMenuBusy(false);
        //   });
      },
    });
  }
);