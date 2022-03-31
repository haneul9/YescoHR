sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/app/MobileMyPagePopoverHandler',
    'sap/ui/yesco/mvc/controller/app/MobileEmployeeSearchDialogHandler',
    'sap/ui/yesco/mvc/controller/app/NotificationPopoverHandler',
    'sap/ui/yesco/mvc/controller/app/control/Menus',
    'sap/ui/yesco/mvc/controller/app/control/MobileMenus',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Time',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    MessageBox,
    BaseController,
    MobileMyPagePopoverHandler,
    MobileEmployeeSearchDialogHandler,
    NotificationPopoverHandler,
    Menus,
    MobileMenus
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.app.App', {
      onInit() {
        this.debug('App.onInit');

        this.bMobile = AppUtils.isMobile();
        if (!this.bMobile) {
          setTimeout(() => {
            this.oAppMenu = new Menus(this);
            this.getOwnerComponent().setAppMenu(this.oAppMenu);
          });
        } else {
          setTimeout(() => {
            this.oAppMenu = new MobileMenus(this);
            this.getOwnerComponent().setAppMenu(this.oAppMenu);
          });
          setTimeout(() => {
            this.initMobile();
          }, 1000);
        }
        setTimeout(() => {
          this.oNotificationPopoverHandler = new NotificationPopoverHandler(this);
        });
      },

      initMobile() {
        window.getToken = (sPushToken) => {
          this.requestSavePushToken(sPushToken);
        };
        setTimeout(() => {
          this.savePushToken();
        });
        setTimeout(() => {
          this.oMobileMyPagePopoverHandler = new MobileMyPagePopoverHandler(this);
        });
        setTimeout(() => {
          this.oMobileEmployeeSearchDialogHandler = new MobileEmployeeSearchDialogHandler(this);
        });
      },

      getAppMenu() {
        return this.oAppMenu;
      },

      getLogoPath(sWerks = 'init') {
        this.byId('logo-image').toggleStyleClass(`logo-${sWerks}`, true);
        return `asset/image/logo-${sWerks}.png`;
      },

      navToHome() {
        this.oAppMenu.closeMenuLayer();

        if (this.bMobile) {
          this.oNotificationPopoverHandler.onPopoverClose();
          this.oMobileMyPagePopoverHandler.onPopoverClose();
          this.oMobileEmployeeSearchDialogHandler.onDialogClose();
        }

        const sCurrentMenuViewId = this.getCurrentMenuViewId();
        if (sCurrentMenuViewId === 'home' || sCurrentMenuViewId === 'mobileHome') {
          return;
        }

        this.oAppMenu.moveToMenu(this.bMobile ? 'ehrMobileHome' : 'ehrHome');
      },

      navToProfile() {
        this.oAppMenu.moveToMenu((this.bMobile ? 'mobile/' : '') + 'employee');
      },

      savePushToken() {
        if (!this.bMobile) {
          return;
        }

        if (/android/i.test(navigator.userAgent) && typeof window.YescoApp !== 'undefined') {
          const sPushToken = window.YescoApp.getToken();
          this.requestSavePushToken(sPushToken);
        } else if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !!window.webkit && !!window.webkit.messageHandlers && !!window.webkit.messageHandlers.script) {
          window.webkit.messageHandlers.script.postMessage('requestToken');
        }
      },

      async requestSavePushToken(sPushToken) {
        try {
          const oModel = this.getModel(ServiceNames.COMMON);
          const mPayload = {
            Pernr: this.getSessionProperty('Pernr'),
            Token: sPushToken,
          };

          await Client.create(oModel, 'PernrToken', mPayload);
        } catch (oError) {
          this.debug('requestSavePushToken error.', oError);
        }
      },

      /**
       * 알림센터 : PC 상단 알림 버튼 & 모바일 하단 5버튼
       * @param {sap.ui.base.Event} oEvent
       */
      onPressNotificationPopoverToggle(oEvent) {
        oEvent.cancelBubble();

        if (this.bMobile) {
          this.oMobileMyPagePopoverHandler.onPopoverClose();
          this.oMobileEmployeeSearchDialogHandler.onDialogClose();
          this.oAppMenu.closeMenuLayer();
        }
        this.oNotificationPopoverHandler.onPopoverToggle();
      },

      /**
       * Portlet 개인화 설정
       */
      onPressPortletsP13nDialogOpen() {
        this.getOwnerComponent().byId('home').getController().onPressPortletsP13nDialogOpen();
      },

      /**
       * My Page : 모바일 하단 5버튼
       */
      onPressMobileMyPagePopoverToggle() {
        this.oNotificationPopoverHandler.onPopoverClose();
        this.oMobileEmployeeSearchDialogHandler.onDialogClose();
        this.oAppMenu.closeMenuLayer();

        this.oMobileMyPagePopoverHandler.onPopoverToggle();
      },

      /**
       * 검색 : 모바일 하단 5버튼
       */
      onPressMobileSearchPopoverToggle() {
        this.oNotificationPopoverHandler.onPopoverClose();
        this.oMobileMyPagePopoverHandler.onPopoverClose();
        this.oAppMenu.closeMenuLayer();

        this.oMobileEmployeeSearchDialogHandler.onDialogToggle();
      },

      /**
       * 메뉴 : 모바일 하단 5버튼
       * @param {sap.ui.base.Event} oEvent
       */
      onPressMobileMenuPopoverToggle(oEvent) {
        this.oNotificationPopoverHandler.onPopoverClose();
        this.oMobileMyPagePopoverHandler.onPopoverClose();
        this.oMobileEmployeeSearchDialogHandler.onDialogClose();

        this.oAppMenu.toggleMenuLayer(oEvent);
      },

      /**
       * 로그아웃
       */
      onPressLogout() {
        // 로그아웃하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_01006'), {
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.YES) {
              if (this.bMobile) {
                location.href = '/sap/public/bc/icf/logoff';
              } else {
                window.open('/sap/public/bc/ui2/zui5_yescohr/logout.html');
                window.close();
              }
            }
          },
        });
      },

      onExit: function () {
        if (this._oMobileMenuPopover) {
          this._oMobileMenuPopover.destroy();
        }
      },
    });
  }
);
