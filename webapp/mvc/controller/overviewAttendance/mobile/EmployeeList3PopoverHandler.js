sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/mobile/MobileEmployeeListPopoverHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList4PopoverHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    MobileEmployeeListPopoverHandler,
    Client,
    ServiceNames,
    EmployeeList4PopoverHandler
  ) => {
    ('use strict');

    /**
     * MSS > HR Boardroom > 근태현황 > 평균근무시간 (Headty : B)
     * MSS > HR Boardroom > 근태현황 > OT근무현황 (Headty : C)
     * MSS > HR Boardroom > 근태현황 > 조직별 OT평균시간 (Headty : H)
     * MSS > HR Boardroom > 근태현황 > 직급별 OT평균시간 (Headty : I)
     * MSS > HR Boardroom > 근태현황 > 주 단위 근무시간 추이 (Headty : J)
     */
    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.mvc.controller.overviewAttendance.mobile.EmployeeList3PopoverHandler', {
      init() {
        MobileEmployeeListPopoverHandler.prototype.init.call(this);

        this.oEmployeeList4PopupHandler = new EmployeeList4PopoverHandler(this.oController);
      },

      getPopoverFragmentName() {
        return 'sap.ui.yesco.mvc.view.overviewAttendance.mobile.EmployeeList3Popover';
      },

      setPropertiesForNavTo(oMenuModel) {
        this.bHasMssMenuAuth = oMenuModel.hasMssMenuAuth();
      },

      async onBeforeOpen() {
        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const mPayload = this.getPayloadData();

        const aEmployees = await Client.getEntitySet(oModel, 'TimeOverviewDetail3', mPayload);
        const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

        this.setEmployeeList(
          aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx, Nomtot, Holtot, Begda, Endda }) => ({
            Photo: Photo || sUnknownAvatarImageURL,
            Ename,
            Pernr,
            Zzjikgbtx,
            Zzjikchtx,
            Orgtx,
            Nomtot: Nomtot || 0,
            Holtot: Holtot || 0,
            Begda,
            Endda,
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

        const mPayload = (oEvent.getParameter('listItem') || oEvent.getSource()).getBindingContext().getProperty();

        this.oEmployeeList4PopupHandler.openPopover({ ..._.pick(mPayload, ['Pernr', 'Begda', 'Endda']) });
      },
    });
  }
);
