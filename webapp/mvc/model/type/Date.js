sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/FormatException',
    'sap/ui/model/ParseException',
    'sap/ui/model/SimpleType',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    FormatException,
    ParseException,
    SimpleType,
    AppUtils
  ) => {
    'use strict';

    return SimpleType.extend('sap.ui.yesco.mvc.model.type.Date', {
      formatValue(oValue, sTargetType) {
        // AppUtils.debug(`sap/ui/yesco/mvc/model/type/Date.formatValue(${oValue}, ${sTargetType})`);

        switch (this.getPrimitiveType(sTargetType)) {
          case 'string':
          case 'any':
            return this._toString(oValue, sTargetType);
          case 'object':
            return this._toObject(oValue, sTargetType);
          default:
            throw new FormatException(`Don't know how to format Date to ${sTargetType}`);
        }
      },

      parseValue(oValue, sTargetType) {
        // AppUtils.debug(`sap/ui/yesco/mvc/model/type/Date.parseValue(${oValue}, ${sTargetType})`);

        switch (this.getPrimitiveType(sTargetType)) {
          case 'string':
            return this._toString(oValue, sTargetType);
          case 'object':
          case 'any':
            return this._toObject(oValue, sTargetType);
          default:
            throw new ParseException(`Don't know how to parse Date from ${sTargetType}`);
        }
      },

      validateValue() {
        return true;
      },

      _toString(oValue, sTargetType) {
        if (!oValue) {
          return '';
        }

        const sDTFMT = AppUtils.getAppComponent().getSessionModel().getProperty('/DTFMT');

        if (oValue instanceof Date) {
          return moment(oValue).format(sDTFMT);
        }

        if (typeof oValue === 'string' || oValue instanceof String) {
          if (/^\/Date/.test(oValue)) {
            const iTime = parseInt(oValue.replace(/\/Date\((-?\d+)\)\//, '$1'), 10);
            return moment(iTime).format(sDTFMT);
          }

          const sDateString = oValue.replace(/[^\d]/g, '');
          return moment(sDateString, 'YYYYMMDD').format(sDTFMT);
        }

        throw new FormatException(`Don't know how to format Date to ${sTargetType}`);
      },

      _toObject(oValue, sTargetType) {
        if (!oValue) {
          return null;
        }

        if (oValue instanceof Date) {
          return oValue;
        }

        if (typeof oValue === 'string' || oValue instanceof String) {
          if (/^\/Date/.test(oValue)) {
            const iTime = parseInt(oValue.replace(/\/Date\((-?\d+)\)\//, '$1'), 10);
            return new Date(iTime);
          }

          const sDateString = oValue.replace(/[^\d]/g, '');
          return moment(sDateString, 'YYYYMMDD').toDate();
        }

        throw new ParseException(`Don't know how to parse Date from ${sTargetType}`);
      },
    });
  }
);
