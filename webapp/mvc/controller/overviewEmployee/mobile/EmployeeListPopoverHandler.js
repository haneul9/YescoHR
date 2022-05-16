sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/mobile/MobileEmployeeListPopoverHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils,
    MobileEmployeeListPopoverHandler,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.mvc.controller.overviewEmployee.mobile.EmployeeListPopoverHandler', {
      getPopoverFragmentName() {
        return 'sap.ui.yesco.fragment.mobile.MobileEmployeeListPopover';
      },

      setPropertiesForNavTo(oMenuModel) {
        this.sProfileMenuUrl = oMenuModel.getEmployeeProfileMenuUrl();
        this.bHasProfileMenuAuth = oMenuModel.hasEmployeeProfileMenuAuth();
      },

      async onBeforeOpen() {
        const oModel = this.oController.getModel(ServiceNames.PA);
        const mPayload = this.getPayload();

        const aEmployees = await Client.getEntitySet(oModel, 'HeadCountDetail', mPayload);
        const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

        this.setEmployeeList(
          aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx }) => ({
            Photo: Photo || sUnknownAvatarImageURL,
            Ename,
            Pernr,
            Zzjikcht: Zzjikgbtx,
            Zzjikgbt: Zzjikchtx,
            Fulln: Orgtx,
            ProfileView: this.bHasProfileMenuAuth ? 'O' : '',
          }))
        );

        this.setBusy(false);
      },

      getPayload() {
        const mSessionProperty = this.oController.getSessionModel().getData();
        const mPayloadData = this.getPayloadData();
        return {
          Zyear: moment().year(),
          Werks: mSessionProperty.Werks,
          Orgeh: mSessionProperty.Orgeh,
          Headty: mPayloadData.Headty,
          Discod: mPayloadData.Discod,
        };
      },

      onAfterClose() {
        this.clearSearchFilter();
        this.clearTerms();
        this.clearEmployeeList();
      },

      onLiveChange(oEvent) {
        const sValue = $.trim(oEvent.getParameter('newValue'));
        if (!sValue) {
          this.clearSearchFilter();
          return;
        }

        const aFilters = new Filter({
          filters: [
            new Filter('Ename', FilterOperator.Contains, sValue), //
            new Filter('Pernr', FilterOperator.Contains, sValue),
          ],
          and: false,
        });

        this.setSearchFilter(aFilters);
      },

      navToProfile(oEvent) {
        if (!this.bHasProfileMenuAuth) {
          return;
        }

        const sPernr = (oEvent.getParameter('listItem') || oEvent.getSource()).getBindingContext().getProperty('Pernr');
        AppUtils.getAppController().getAppMenu().moveToMenu(this.sProfileMenuUrl, { pernr: sPernr });
      },
    });
  }
);
