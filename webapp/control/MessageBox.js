sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/MessageBox',
  ],
  function (
    // prettier 방지용 주석
    MessageBox
  ) {
    'use strict';

    const getBundleText = (sCode) => {
      return sap.ui.getCore().getComponent('container-ehr').getModel('i18n').getResourceBundle().getText(sCode);
    };

    const sDevice =
      sap.ui.Device.system.desktop === true // prettier 방지용 주석
        ? sap.ui.Device.system.SYSTEMTYPE.DESKTOP
        : sap.ui.Device.system.phone === true
        ? sap.ui.Device.system.SYSTEMTYPE.PHONE
        : sap.ui.Device.system.tablet === true
        ? sap.ui.Device.system.SYSTEMTYPE.PHONE
        : '';
    const changePosition = (sMessageBoxSelector) => {
      if (sDevice === sap.ui.Device.system.SYSTEMTYPE.DESKTOP) return;

      setTimeout(() => {
        const $messageBox = $(sMessageBoxSelector);
        const iScreenHeight = screen.availHeight;
        const iBottomPadding = 80;

        $messageBox.offset({ top: iScreenHeight - $messageBox.outerHeight() - iBottomPadding });
      }, 0);
    };

    return {
      ...MessageBox,
      show(vMessage, mOptions = {}) {
        MessageBox.show(vMessage, { ...mOptions, title: getBundleText('LABEL_SHOW') }); // 보기
        changePosition('.sapMMessageBoxStandard');
      },
      alert(vMessage, mOptions = {}) {
        MessageBox.alert(vMessage, { ...mOptions, title: getBundleText('LABEL_ALERT') }); // 안내
        changePosition('.sapMMessageBoxStandard');
      },
      confirm(vMessage, mOptions = {}) {
        MessageBox.confirm(vMessage, { ...mOptions, title: getBundleText('LABEL_CONFIRM') }); // 확인
        changePosition('.sapMMessageBoxQuestion');
      },
      error(vMessage, mOptions = {}) {
        MessageBox.error(vMessage, { ...mOptions, title: getBundleText('LABEL_ERROR') }); // 오류
        changePosition('.sapMMessageBoxError');
      },
      information(vMessage, mOptions = {}) {
        MessageBox.information(vMessage, { ...mOptions, title: getBundleText('LABEL_INFORMATION') }); // 정보
        changePosition('.sapMMessageBoxInfo');
      },
      success(vMessage, mOptions = {}) {
        MessageBox.success(vMessage, { ...mOptions, title: getBundleText('LABEL_SUCCESS') }); // 성공
        changePosition('.sapMMessageBoxSuccess');
      },
      warning(vMessage, mOptions = {}) {
        MessageBox.warning(vMessage, { ...mOptions, title: getBundleText('LABEL_WARNING') }); // 경고
        changePosition('.sapMMessageBoxWarning');
      },
    };
  }
);
