sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/MessageBox',
    'sap/ui/yesco/common/AppUtils',
  ],
  function (
    // prettier 방지용 주석
    MessageBox,
    AppUtils
  ) {
    'use strict';

    return {
      ...MessageBox,
      alert(vMessage, mOptions = {}) {
        MessageBox.alert(vMessage, { ...mOptions, title: AppUtils.getBundleText('LABEL_ALERT') }); // 안내
      },
      confirm(vMessage, mOptions = {}) {
        MessageBox.confirm(vMessage, { ...mOptions, title: AppUtils.getBundleText('LABEL_CONFIRM') }); // 확인
      },
      error(vMessage, mOptions = {}) {
        MessageBox.error(vMessage, { ...mOptions, title: AppUtils.getBundleText('LABEL_ERROR') }); // 오류
      },
      information(vMessage, mOptions = {}) {
        MessageBox.information(vMessage, { ...mOptions, title: AppUtils.getBundleText('LABEL_INFORMATION') }); // 정보
      },
      show(vMessage, mOptions = {}) {
        MessageBox.show(vMessage, { ...mOptions, title: AppUtils.getBundleText('LABEL_SHOW') }); // 보기
      },
      success(vMessage, mOptions = {}) {
        MessageBox.success(vMessage, { ...mOptions, title: AppUtils.getBundleText('LABEL_SUCCESS') }); // 성공
      },
      warning(vMessage, mOptions = {}) {
        MessageBox.warning(vMessage, { ...mOptions, title: AppUtils.getBundleText('LABEL_WARNING') }); // 경고
      },
    };
  }
);
