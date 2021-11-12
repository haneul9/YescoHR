sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/MessageBox',
    'sap/ui/yesco/common/AppUtils',
  ],
  function (
    // prettier 방지용 주석
    SapMMessageBox,
    AppUtils
  ) {
    'use strict';

    return {
      ...SapMMessageBox,
      alert(vMessage, mOptions = {}) {
        SapMMessageBox.alert(vMessage, { ...mOptions, title: AppUtils.getAppController().getText('MSG_ALERT') }); // 안내
      },
      confirm(vMessage, mOptions = {}) {
        SapMMessageBox.confirm(vMessage, { ...mOptions, title: AppUtils.getAppController().getText('MSG_CONFIRM') }); // 확인
      },
      error(vMessage, mOptions = {}) {
        SapMMessageBox.error(vMessage, { ...mOptions, title: AppUtils.getAppController().getText('MSG_ERROR') }); // 오류
      },
      information(vMessage, mOptions = {}) {
        SapMMessageBox.information(vMessage, { ...mOptions, title: AppUtils.getAppController().getText('MSG_INFORMATION') }); // 정보
      },
      show(vMessage, mOptions = {}) {
        SapMMessageBox.show(vMessage, { ...mOptions, title: AppUtils.getAppController().getText('MSG_SHOW') }); // 보기
      },
      success(vMessage, mOptions = {}) {
        SapMMessageBox.success(vMessage, { ...mOptions, title: AppUtils.getAppController().getText('MSG_SUCCESS') }); // 성공
      },
      warning(vMessage, mOptions = {}) {
        SapMMessageBox.warning(vMessage, { ...mOptions, title: AppUtils.getAppController().getText('MSG_WARNING') }); // 경고
      },
    };
  }
);
