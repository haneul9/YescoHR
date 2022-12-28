sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/FormatException',
    'sap/ui/model/ParseException',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    FormatException,
    ParseException,
    AppUtils
  ) => {
    'use strict';

    /**
     * 주의 : formatter 사용시 format으로 변환된 값은 해당 control에만 적용되며
     *        model이 TwoWay binding mode라도 model에는 저장되지 않음
     *        model에도 저장이 되도록 하려면 SimpleType을 확장하여 커스텀 type을 만들어 사용해야함
     *        예) sap.ui.yesco.mvc.model.type.Date
     */
    const DateUtils = {
      format(vValue) {
        if (!vValue) {
          return null;
        }
        const sDTFMT = AppUtils.getAppComponent().getSessionModel().getProperty('/DTFMT');
        if (vValue instanceof Date) {
          return moment(vValue).format(sDTFMT);
        }
        if (vValue instanceof String || typeof vValue === 'string') {
          if (/^\/Date/.test(vValue)) {
            const iTime = parseInt(vValue.replace(/\/Date\((-?\d+)\)\//, '$1'), 10);
            return moment(iTime).format(sDTFMT);
          }
          const sDateString = vValue.replace(/[^\d]/g, '');
          return moment(sDateString, 'YYYYMMDD').format(sDTFMT);
        }
        throw new FormatException(`Don't know how to format Date from ${vValue}`);
      },

      parse(vValue) {
        if (!vValue) {
          return null;
        }
        if (vValue instanceof Date) {
          return DateUtils.trimTime(vValue);
        }
        if (vValue instanceof String || typeof vValue === 'string') {
          if (/^\/Date/.test(vValue)) {
            const iTime = parseInt(vValue.replace(/\/Date\((-?\d+)\)\//, '$1'), 10);
            return DateUtils.trimTime(iTime);
          }
          return DateUtils.trimTime(vValue);
        }
        throw new ParseException(`Don't know how to parse Date from ${vValue}`);
      },

      getFromToDates({ fromDateFieldName, toDateFieldName, period = 1, periodUnit = 'month' }) {
        const oTodayMoment = DateUtils.getMoment();
        return {
          [toDateFieldName]: oTodayMoment.toDate(),
          [fromDateFieldName]: oTodayMoment.subtract(period, periodUnit).add(1, 'day').toDate(),
        };
      },

      trimTime(vDate) {
        return DateUtils.getMoment(vDate).toDate();
      },

      /**
       * @param {*} vDate
       * @param {*} trimTime true: OData에서 받을 때 UTC+0로 받을 수 있도록 UTC+9으로 parsing 또는 생성된 moment 제공
       * @returns
       */
      getMoment(vDate, trimTime = true) {
        let o;
        if (moment.isMoment(vDate)) {
          o = vDate;
        } else if (vDate instanceof String || typeof vDate === 'string') {
          o = moment(vDate.replace(/\D/g, ''), 'YYYYMMDDHHmmss');
        } else {
          o = moment(vDate); // Date or Number or undefined
        }
        return trimTime ? o.startOf('day').hours(9) : o;
      },

      getToday() {
        return DateUtils.trimTime();
      },
    };

    return DateUtils;
  }
);
