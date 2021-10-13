sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/CustomData',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/JSONModelHelper',
    'sap/ui/yesco/control/HomeMenuItem',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/extension/lodash',
    'sap/ui/yesco/extension/moment',
  ],
  (
    // prettier 방지용 주석
    CustomData,
    JSONModel,
    AppUtils,
    JSONModelHelper,
    HomeMenuItem,
    BaseController,
    lodashjs,
    momentjs
  ) => {
    'use strict';

    class App extends BaseController {
      onInit() {
        // Moment, Lodash test
        // const day = moment();
        // this.debug(day); // BaseController에 선언됨

        // this.debug('lodash');
        // this.debug(_.join(['1', '2', '3'], '~'));
        // this.debug('lodash');

        // this.debug(AppUtils.getDevice());

        const iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
        const fnSetAppNotBusy = function fnSetAppNotBusy() {
          oAppViewModel.setProperty('/busy', false);
          oAppViewModel.setProperty('/delay', iOriginalBusyDelay);
        };
        const oAppViewModel = new JSONModel({
          busy: false,
          delay: 0,
        });
        this.setViewModel(oAppViewModel, 'appView');

        // apply content density mode to root view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

        const oCommonModel = this.getModel(); // ZHR_COMMON_SRV
        const sUrl = '/GetMenuLvSet';
        oCommonModel.create(
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

              this.buildHomeMenu(oData).then(fnSetAppNotBusy);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              this.buildHomeMenu().then(fnSetAppNotBusy);
            },
          }
        );
      }

      buildHomeMenu(menuDataSet = {}) {
        return new Promise((resolve) => {
          const { GetMenuLv1Nav = {}, GetMenuLv2Nav = {}, GetMenuLv3Nav = {}, GetMenuLv4Nav = {} } = menuDataSet;
          const { results: menuLevel1 = [] } = GetMenuLv1Nav;
          const { results: menuLevel2 = [] } = GetMenuLv2Nav;
          const { results: menuLevel3 = [] } = GetMenuLv3Nav;
          const { results: menuLevel4 = [] } = GetMenuLv4Nav;
          const homeMenu = this.byId('homeMenu');

          if (!menuLevel1.length) {
            homeMenu.insertContent(new Label({ text: '조회된 메뉴가 없습니다.' }), 2);
            resolve();
            return;
          }

          // Home menu 생성
          menuLevel1.forEach((menu, i) => {
            const homeMenuItem = new HomeMenuItem({
              text: menu.Mnnm1,
              customData: new CustomData({ key: 'menuProperties', value: menu }),
            });
            homeMenu.insertContent(homeMenuItem, i + 2); // Home logo, ToolbarSpacer 이후부터 menu 추가
          });

          resolve();
        });
      }

      onHomePress() {
        // var iconTabHeader = this.byId('iconTabHeader');
        // iconTabHeader.setSelectedKey('invalidKey');

        // var label = this.byId('labelId');
        // label.setText('Home Screen');
        this.getRouter().navTo('appHome');

        // TODO : master 전환 후 callback 호출 필요(ex: localStorage, sessionStorage, global temporary variables/functions 등 제거 callback)
      }

      onSelectTab(event) {
        // var label = this.byId('labelId');
        const tab = event.getParameter('item');

        // label.setText(tab.getText());
      }

      navigateTo(event) {
        // var label = this.byId('labelId');
        // this.getRouter().navTo(label);
      }

      navigateToHome(event) {
        this.getRouter().navTo('appHome');
      }

      navigateToCarousel(event) {
        this.getRouter().navTo('carousel');
      }

      navigateToPage1(event) {
        this.getRouter().navTo('page1');
      }

      navigateToPage2(event) {
        this.getRouter().navTo('page2');
      }

      navigateToUserForm(event) {
        this.getRouter().navTo('userform');
      }

      navigateToAppConfig(event) {
        this.getRouter().navTo('appconfig');
      }

      navigateToRouting(event) {
        this.getRouter().navTo('page1');
      }

      onUserNamePress() {}
    }

    return App;
  }
);
