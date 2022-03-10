sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils,
    Client,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.employee.mobile.Card', {
      initializeModel() {
        return {
          busy: false,
          isLoaded: false,
          pernr: null,
          orgtx: null,
          orgeh: null,
          scrollHeight: '500',
          search: { searchText: '', selectedState: '3' },
          results: [],
        };
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();
        const bIsLoaded = oViewModel.getProperty('/isLoaded');

        if (!bIsLoaded) {
          const mSessionData = this.getSessionData();
          const sPernr = oParameter.pernr || mSessionData.Pernr;
          const sOrgtx = _.replace(oParameter.orgtx, /--/g, '/') || mSessionData.Orgtx;
          const sOrgeh = oParameter.orgeh ?? mSessionData.Orgeh;

          oViewModel.setSizeLimit(1000);
          oViewModel.setProperty('/isLoaded', true);
          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/pernr', sPernr);
          oViewModel.setProperty('/orgtx', sOrgtx);
          oViewModel.setProperty('/orgeh', sOrgeh);
          if (!_.isEmpty(sOrgtx)) {
            oViewModel.setProperty('/search/searchText', sOrgtx);
          }

          this.initialList({ oViewModel, sPernr, sOrgtx, sOrgeh });
        }
      },

      async initialList({ oViewModel, sPernr, sOrgtx, sOrgeh }) {
        try {
          const mSessionData = this.getSessionData();
          const sSearchText = _.isEmpty(sOrgtx) ? sPernr : sOrgtx;
          const sSearchOrgeh = _.isEmpty(sOrgeh) ? _.noop() : sOrgeh;
          const aSearchResults = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Persa: mSessionData.Werks,
            Zflag: 'X',
            Actda: moment().hours(9).toDate(),
            Ename: sSearchText,
            Orgeh: sSearchOrgeh,
          });

          this.onChangeStat();

          oViewModel.setProperty(
            '/results',
            _.map(aSearchResults, (o) => ({ ...o, Photo: _.isEmpty(o.Photo) ? 'asset/image/avatar-unknown.svg' : o.Photo }))
          );
        } catch (oError) {
          this.debug('Controller > Mobile-Employee-Card > initialList Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onPressEmployeeSearch(oEvent) {
        const oViewModel = this.getViewModel();
        const sSearchText = oEvent.getSource().getValue();

        if (!sSearchText) {
          return;
        } else if (sSearchText.length < 2) {
          MessageBox.alert(this.getBundleText('MSG_00056')); // 검색어는 2자 이상이어야 합니다.
          return;
        }

        try {
          const aSearchResults = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Persa: this.getSessionProperty('Werks'),
            Zflag: 'X',
            Actda: moment().hours(9).toDate(),
            Ename: sSearchText,
          });

          oViewModel.setProperty(
            '/results',
            _.map(aSearchResults, (o) => ({ ...o, Photo: _.isEmpty(o.Photo) ? 'asset/image/avatar-unknown.svg' : o.Photo }))
          );
        } catch (oError) {
          this.debug('Controller > Mobile-Employee-Card > onPressEmployeeSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onChangeStat() {
        const oViewModel = this.getViewModel();
        const oEmployeeCardList = this.byId('employeeCardList');
        const sStat = oViewModel.getProperty('/search/selectedState');
        const oStatFilter = new Filter('Stat2', FilterOperator.EQ, sStat);

        oEmployeeCardList.getBinding('items').filter(!sStat ? [] : [oStatFilter]);
      },

      onClickEmployeeCard(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getSource().getBindingContext().getPath();
        const sPernr = oViewModel.getProperty(`${sPath}/Pernr`);

        if (!sPernr) {
          MessageBox.alert(this.getBundleText('MSG_00035')); // 대상자 사번이 없습니다.
          return;
        }

        this.getRouter().navTo('mobile/m/employee-detail', { pernr: sPernr });
      },
    });
  }
);
