sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/mobile/MobileEmployeeListPopoverHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    MobileEmployeeListPopoverHandler,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.mvc.controller.overviewAttendance.mobile.EmployeeList4PopoverHandler', {
      getPopoverFragmentName() {
        return 'sap.ui.yesco.mvc.view.overviewAttendance.mobile.EmployeeList4Popover';
      },

      setPropertiesForNavTo(oMenuModel) {
        this.bHasMssMenuAuth = oMenuModel.hasMssMenuAuth();
      },

      async onBeforeOpen() {
        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const mPayload = this.getPayloadData();

        const aEmployees = await Client.getEntitySet(oModel, 'TimeOverviewDetail4', mPayload);
        const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

        this.setEmployeeList(
          aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx, Datum, Bashr, Addhr }) => ({
            Photo: Photo || sUnknownAvatarImageURL,
            Ename,
            Pernr,
            Zzjikgbtx,
            Zzjikchtx,
            Orgtx,
            Datum,
            Bashr: Bashr || 0,
            Addhr: Addhr || 0,
            Navigable: this.bHasMssMenuAuth ? 'O' : '',
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
        this.filterEmployeeList(oEvent);
      },

      navTo(oEvent) {
        if (!this.bHasMssMenuAuth) {
          return;
        }

        const mRowData = (oEvent.getParameter('listItem') || oEvent.getSource()).getBindingContext();
        const sPernr = mRowData.getProperty('Pernr');
        const oDatum = moment(mRowData.getProperty('Datum'));
        const mParameter = {
          pernr: sPernr,
          year: oDatum.year(),
          month: oDatum.month(),
        };
        AppUtils.getAppController().getAppMenu().moveToMenu('mobile/individualWorkState', mParameter);
      },
    });
  }
);
