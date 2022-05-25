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

    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.common.mobile.MobilePhoneNumberListPopoverHandler', {
      getPopoverFragmentName() {
        return 'sap.ui.yesco.fragment.mobile.MobilePhoneNumberListPopover';
      },

      onAfterClose() {
        this.clearTerms();
        this.clearEmployeeList();
      },

      onLiveChange(oEvent) {
        if (this.liveChangeInterval) {
          clearInterval(this.liveChangeInterval);
        }

        const sValue = $.trim(oEvent.getParameter('newValue'));
        if (!sValue || sValue.length < 2) {
          this.clearEmployeeList();
          return;
        }

        this.liveChangeInterval = setInterval(() => {
          clearInterval(this.liveChangeInterval);
          this.readEmployeeList(sValue);
        }, 500);
      },

      async readEmployeeList(sValue) {
        try {
          this.setBusy();

          const oModel = this.oController.getModel(ServiceNames.COMMON);
          const mFilters = {
            Ename: sValue,
            Stat2: '3',
            Accty: 'M', // 권한 해제 : 타사 임직원도 검색 + 전화번호
          };

          const aEmployeeList = await Client.getEntitySet(oModel, 'EmpSearchResult', mFilters);
          const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

          this.setEmployeeList(
            aEmployeeList.map((mEmployee) => {
              mEmployee.Photo = mEmployee.Photo || sUnknownAvatarImageURL;
              mEmployee.IconMode = 'Telephone';
              return mEmployee;
            })
          );
        } catch (oError) {
          AppUtils.debug('MobileEmployeeSearchPopoverHandler > readEmployeeList Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.closePopover(),
          });
        } finally {
          this.setBusy(false);
        }
      },
    });
  }
);
