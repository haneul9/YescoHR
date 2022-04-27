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

    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.common.mobile.MobileEmployeeSearchPopoverHandler', {
      /**
       * @override
       */
      constructor: function (oController) {
        MobileEmployeeListPopoverHandler.apply(this, [oController, 'Telephone']);
      },

      onAfterClose() {
        this.oPopoverModel.setProperty('/popover/terms', null);
        this.oPopoverModel.setProperty('/popover/employees', []);
      },

      async openPopover(oEvent) {
        // Do nothing.
      },

      liveChange(oEvent) {
        if (this.liveChangeInterval) {
          clearInterval(this.liveChangeInterval);
        }

        const sValue = $.trim(oEvent.getParameter('newValue'));
        if (!sValue || sValue.length < 2) {
          this.oPopoverModel.setProperty('/popover/employees', []);
          return;
        }

        this.liveChangeInterval = setInterval(() => {
          clearInterval(this.liveChangeInterval);
          this.showSuggestionData(sValue);
        }, 500);
      },

      async showSuggestionData(sValue) {
        try {
          this.setBusy(true);
          const aEmployees = await this.readSuggestionData(sValue);
          const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

          this.oPopoverModel.setProperty(
            '/popover/employees',
            aEmployees.map((mEmployee) => {
              mEmployee.Photo ||= sUnknownAvatarImageURL;
              mEmployee.IconMode = this.sIconMode;
              return mEmployee;
            })
          );
        } catch (oError) {
          AppUtils.debug('MobileEmployeeSearchPopoverHandler > showSuggestionData Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.closePopover(),
          });
        } finally {
          this.setBusy(false);
        }
      },

      async readSuggestionData(sValue) {
        const oModel = this.oController.getModel(ServiceNames.COMMON);
        const mFilters = {
          Ename: sValue,
          Stat2: '3',
          Accty: 'M', // 권한 해제 : 타사 임직원도 검색 + 전화번호
        };

        return Client.getEntitySet(oModel, 'EmpSearchResult', mFilters);
      },
    });
  }
);
