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

    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.mvc.controller.overviewAttendance.mobile.EmployeeList5PopoverHandler', {
      getPopoverFragmentName() {
        return 'sap.ui.yesco.mvc.view.overviewAttendance.mobile.EmployeeList5Popover';
      },

      setPropertiesForNavTo(oMenuModel) {
        this.sProfileMenuUrl = oMenuModel.getEmployeeProfileMenuUrl();
        this.bHasProfileMenuAuth = oMenuModel.hasEmployeeProfileMenuAuth();
      },

      async onBeforeOpen() {
        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const mPayload = this.getPayloadData();

        const aEmployees = await Client.getEntitySet(oModel, 'TimeOverviewDetail5', mPayload);
        const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

        this.setEmployeeList(
          aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx, Atext, Tmdat }) => ({
            Photo: Photo || sUnknownAvatarImageURL,
            Ename,
            Pernr,
            Zzjikgbtx,
            Zzjikchtx,
            Orgtx,
            Atext,
            Tmdat,
            Navigable: this.bHasProfileMenuAuth ? 'O' : '',
          }))
        );

        this.setBusy(false);
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

      navTo(oEvent) {
        if (!this.bHasProfileMenuAuth) {
          return;
        }

        const mRowData = (oEvent.getParameter('listItem') || oEvent.getSource()).getBindingContext();
        const sPernr = mRowData.getProperty('Pernr');
        const oTmdat = moment(mRowData.getProperty('Tmdat'));
        const mParameter = {
          pernr: sPernr,
          year: oTmdat.get('year'),
          month: oTmdat.get('month'),
        };
        AppUtils.getAppController().getAppMenu().moveToMenu('mobile/individualWorkState', mParameter);
      },
    });
  }
);
