sap.ui.define(
  [
    // prettier 방지용 주석
  ],
  () =>
    // prettier 방지용 주석
    {
      'use strict';

      return {
        get(bTargetChangeButtonHide = false) {
          const oSessionData = this.getOwnerComponent().getSessionModel().getData();
          const oViewModel = this.getViewModel();
          const oViewModelData = this.getViewModel().getData();

          // 사원이미지가 없을때 기본이미지
          if (!oSessionData.Photo) {
            oSessionData.Photo = 'https://i1.wp.com/jejuhydrofarms.com/wp-content/uploads/2020/05/blank-profile-picture-973460_1280.png?ssl=1';
          }

          oViewModelData.TargetInfo = {
            ...oSessionData,
            Hide: bTargetChangeButtonHide,
          };
          oViewModel.setData(oViewModelData);
        },
      };
    }
);
