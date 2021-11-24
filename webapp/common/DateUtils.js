sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    AppUtils
  ) => {
    'use strict';

    const DateUtils = {
      format(vValue) {
        if (!vValue) {
          return null;
        }
        const sDTFMT = AppUtils.getAppComponent().getSessionModel().getProperty('/DTFMT');
        return moment(DateUtils.parse(vValue)).format(sDTFMT);
      },

      parse(vValue) {
        if (!vValue) {
          return null;
        }
        return new Date(parseInt(vValue.replace(/\/Date\((-*\d+)\)\//, '$1'), 10));
      },
    };

    return DateUtils;
  }
);
