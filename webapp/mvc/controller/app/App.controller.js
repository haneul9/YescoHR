sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/InstanceManager',
    'sap/ui/core/routing/HashChanger',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/UriHandler',
    'sap/ui/yesco/common/mobile/MobilePhoneNumberListPopoverHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/app/MobileMyPagePopoverHandler',
    'sap/ui/yesco/mvc/controller/app/NotificationPopoverHandler',
    'sap/ui/yesco/mvc/controller/app/control/Menus',
    'sap/ui/yesco/mvc/controller/app/control/MobileMenus',
    'sap/ui/yesco/mvc/model/type/Boolean',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/CurrencyBlank',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/DateWeekday',
    'sap/ui/yesco/mvc/model/type/Decimal',
    'sap/ui/yesco/mvc/model/type/Docno',
    'sap/ui/yesco/mvc/model/type/InputTime',
    'sap/ui/yesco/mvc/model/type/Mileage',
    'sap/ui/yesco/mvc/model/type/Month',
    'sap/ui/yesco/mvc/model/type/MonthDate',
    'sap/ui/yesco/mvc/model/type/MonthDateWeekday',
    'sap/ui/yesco/mvc/model/type/Percent',
    'sap/ui/yesco/mvc/model/type/Pernr',
    'sap/ui/yesco/mvc/model/type/ShortPosition',
    'sap/ui/yesco/mvc/model/type/ShortYearDate',
    'sap/ui/yesco/mvc/model/type/Time',
    'sap/ui/yesco/mvc/model/type/Year',
  ],
  (
    // prettier 방지용 주석
    InstanceManager,
    HashChanger,
    AppUtils,
    UriHandler,
    MobilePhoneNumberListPopoverHandler,
    Client,
    ServiceNames,
    MessageBox,
    BaseController,
    MobileMyPagePopoverHandler,
    NotificationPopoverHandler,
    Menus,
    MobileMenus
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.app.App', {
      onInit() {
        this.debug('App.onInit');

        const oUIComponent = this.getOwnerComponent();

        this.bMobile = AppUtils.isMobile();
        if (!this.bMobile) {
          setTimeout(() => {
            this.oAppMenu = new Menus(this);
            oUIComponent.setAppMenu(this.oAppMenu);
          });

          const oUriHandler = new UriHandler();
          const oAppModel = oUIComponent.getAppModel();
          oAppModel.setProperty('/languageVisible', oUriHandler.getParameter('language-test') === 'true');
          oAppModel.setProperty('/language', oUriHandler.getParameter('sap-language') || 'KO');
        } else {
          setTimeout(() => {
            this.oAppMenu = new MobileMenus(this);
            oUIComponent.setAppMenu(this.oAppMenu);
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
        setTimeout(() => {
          this.savePushToken();
        });
        setTimeout(() => {
          this.oMobileMyPagePopoverHandler = new MobileMyPagePopoverHandler(this);
        });
        setTimeout(() => {
          this.oMobilePhoneNumberListPopoverHandler = new MobilePhoneNumberListPopoverHandler(this);
        });
        setTimeout(() => {
          const sHost = /^localhost/.test(location.hostname) || /^(yeshrsapdev|devhrportal)/.test(location.hostname) ? 'dev' : 'prd';
          this.getOwnerComponent().getAppModel().setProperty('/homebarBackground', sHost);
        });
      },

      getAppMenu() {
        return this.oAppMenu;
      },

      getLogoPath(sWerks) {
        const logoName = '1000,2000,3000'.split(',').includes(sWerks) ? `logo-${sWerks}` : 'logo-1000';
        this.byId('logo-image').toggleStyleClass(logoName, true);
        return this.getImageURL(`${logoName}.png`);
      },

      navToHome() {
        this.oAppMenu.closeMenuLayer();

        if (this.bMobile) {
          this.toggleMobileBasisButtonsImage('home');

          InstanceManager.closeAllPopovers();
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
          window.getToken = (sPushToken) => {
            this.requestSavePushToken(sPushToken);
          };
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

      onChangeLanguage(oEvent) {
        AppUtils.setAppBusy(true).setMenuBusy(true);

        const sLanguageKey = oEvent.getParameter('selectedItem').getKey();
        const oUriHandler = new UriHandler();
        if (oUriHandler.getParameter('sap-language') !== sLanguageKey) {
          oUriHandler.setParameter('sap-language', sLanguageKey).redirect();
        } else {
          AppUtils.setAppBusy(false).setMenuBusy(false);
        }
      },

      /**
       * 알림센터 : PC 상단 알림 버튼 & 모바일 하단 5버튼
       * @param {sap.ui.base.Event} oEvent
       */
      onPressNotificationPopoverToggle(oEvent) {
        oEvent.cancelBubble();

        if (this.bMobile) {
          this.toggleMobileBasisButtonsImage('notification');

          InstanceManager.closeAllPopovers();
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
        this.toggleMobileBasisButtonsImage('mypage');

        InstanceManager.closeAllPopovers();
        this.oAppMenu.closeMenuLayer();

        this.oMobileMyPagePopoverHandler.onPopoverToggle();
      },

      /**
       * 검색 : 모바일 하단 5버튼
       */
      onPressMobileSearchPopoverToggle(oEvent) {
        this.toggleMobileBasisButtonsImage('search');

        InstanceManager.closeAllPopovers();
        this.oAppMenu.closeMenuLayer();

        this.oMobilePhoneNumberListPopoverHandler.togglePopover(oEvent);
      },

      /**
       * 메뉴 : 모바일 하단 5버튼
       * @param {sap.ui.base.Event} oEvent
       */
      onPressMobileMenuPopoverToggle(oEvent) {
        this.toggleMobileBasisButtonsImage('menu');

        InstanceManager.closeAllPopovers();
        this.oAppMenu.toggleMenuLayer(oEvent);
      },

      toggleMobileBasisButtonsImage(sId) {
        setTimeout(() => {
          const oButton = this.byId(`mobile-basis-${sId}`); // 메뉴 이동시 버튼의 hover 이미지를 제거하기 위해 Component.js 에서 sId를 빈 값으로 넘기는 경우가 있음
          if (oButton) {
            const sIcon = oButton.getIcon();
            if (sIcon.endsWith('_hover1.svg')) {
              if (sId === 'home' && HashChanger.getInstance().getHash() === 'mobile') {
                return;
              }
              oButton.setIcon(this.getImageURL(`icon_m_${sId}1.svg`));
              return;
            }
            oButton.setIcon(this.getImageURL(`icon_m_${sId}_hover1.svg`));
          }
          const aBasisButtonIds = ['mypage', 'notification', 'home', 'search', 'menu'];
          aBasisButtonIds
            .filter((s) => s !== sId)
            .forEach((s) => {
              setTimeout(() => {
                this.byId(`mobile-basis-${s}`).setIcon(this.getImageURL(`icon_m_${s}1.svg`));
              });
            });
        });
      },

      /**
       * 로그아웃
       */
      onPressLogout() {
        const aActions = [MessageBox.Action.YES, MessageBox.Action.NO];

        // 로그아웃하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_01006'), {
          actions: AppUtils.isMobile() ? _.reverse(aActions) : aActions,
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.YES) {
              // from=logoff : 모바일(iOS)에서 로그아웃 후 생체인증으로 바로 다시 로그인 되어버리는 현상 방지를 위해 추가
              location.href = this.bMobile ? '/sap/public/bc/icf/logoff?from=logoff' : this.getStaticResourceURL('logoff.html');
            }
          },
        });
      },
    });
  }
);
