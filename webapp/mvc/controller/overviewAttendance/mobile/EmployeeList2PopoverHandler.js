sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/mobile/MobileEmployeeListPopoverHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList5PopoverHandler',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils,
    MobileEmployeeListPopoverHandler,
    Client,
    ServiceNames,
    EmployeeList5PopoverHandler
  ) => {
    'use strict';

    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.mvc.controller.overviewAttendance.mobile.EmployeeList2PopoverHandler', {
      init() {
        MobileEmployeeListPopoverHandler.prototype.init.call(this);

        this.oEmployeeList5PopupHandler = new EmployeeList5PopoverHandler(this.oController);
      },

      getPopoverFragmentName() {
        return 'sap.ui.yesco.mvc.view.overviewAttendance.mobile.EmployeeList2Popover';
      },

      setPropertiesForNavTo(oMenuModel) {
        this.sProfileMenuUrl = oMenuModel.getEmployeeProfileMenuUrl();
        this.bHasProfileMenuAuth = oMenuModel.hasEmployeeProfileMenuAuth();
      },

      async onBeforeOpen() {
        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const mPayload = this.getPayloadData();

        const aEmployees = await Client.getEntitySet(oModel, 'TimeOverviewDetail2', mPayload);
        const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

        this.setEmployeeList(
          aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx, Crecnt, Dedcnt, Balcnt, Plncnt, Begda, Endda }) => ({
            Photo: Photo || sUnknownAvatarImageURL,
            Ename,
            Pernr,
            Zzjikgbtx,
            Zzjikchtx,
            Orgtx,
            Crecnt: Crecnt || 0,
            Dedcnt: Dedcnt || 0,
            Balcnt: Balcnt || 0,
            Plncnt: Plncnt || 0,
            Begda,
            Endda,
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

        const sDiscod = this.getPayloadData().Discod;
        const sAwart = _.includes(['3', '4'], sDiscod) ? '2010' : '2000';
        const mPayload = (oEvent.getParameter('listItem') || oEvent.getSource()).getBindingContext().getProperty();

        this.oEmployeeList5PopupHandler.openPopover({ ..._.pick(mPayload, ['Pernr', 'Begda', 'Endda']), Awart: sAwart });
      },
    });
  }
);
