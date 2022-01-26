sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.mvc.controller.individualWorkState.YearPlanBoxHandler', {
      constructor: function ({ oController }) {
        this.oController = oController;
      },

      async getYearPlan(sYear = String(moment().year())) {
        const oViewModel = this.oController.getViewModel();
        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const sWerks = this.oController.getAppointeeProperty('Werks');
        const mPayLoad = {
          Werks: sWerks,
          Tmyea: sYear,
        };

        // 1년근태
        const aList1 = await Client.getEntitySet(oModel, 'PersonalTimeDashboard', mPayLoad);
        // 근태유형 색상
        const aTimeTypeList = await Client.getEntitySet(oModel, 'TimeTypeLegend', { Werks: sWerks });

        oViewModel.setProperty(
          '/TimeTypeList',
          _.each(aTimeTypeList, (e) => {
            e.classNames = e.Colty.toLowerCase();
          })
        );
        oViewModel.setProperty(
          '/yearPlan',
          _.each(aList1, (e) => {
            e.FullDate = e.Tmyea + e.Tmmon + e.Tmday;
          })
        );
        this.makeCalendarControl();
      },
      async onPressPrevYear() {
        const oViewModel = this.oController.getViewModel();
        const iCurrentYear = oViewModel.getProperty('/year');

        oViewModel.setProperty('/year', iCurrentYear - 1);
        await this.oController.YearPlanBoxHandler.getYearPlan(iCurrentYear - 1);
      },

      async onPressNextYear() {
        const oViewModel = this.oController.getViewModel();
        const iCurrentYear = oViewModel.getProperty('/year');

        oViewModel.setProperty('/year', iCurrentYear + 1);
        await this.oController.YearPlanBoxHandler.getYearPlan(iCurrentYear + 1);
      },

      onMouseOverDayBox(oDayBox) {
        // console.log(oDayBox.data('day'));
      },

      onMouseOutDayBox(oDayBox) {
        // console.log(oDayBox.data('day'));
      },

      makeCalendarControl() {
        const oViewModel = this.oController.getViewModel();
        const mBody = _.times(12, this.getWeekBody.bind(this));

        oViewModel.setProperty('/plans', [...this.getWeekHeader(), ...mBody.reduce((a, b) => [...a, ...b], [])]);
      },

      getWeekBody(month) {
        const oViewModel = this.oController.getViewModel();
        const iYear = oViewModel.getProperty('/year');
        const dFirstDayOfYear = moment({ y: iYear, M: month, d: 1 });
        const iDaysInMonth = dFirstDayOfYear.daysInMonth();
        const iFirstDay = dFirstDayOfYear.day();
        const iLeadingNoneCount = iFirstDay === 0 ? 6 : iFirstDay - 1;
        const iTrailingNoneCount = 37 - iLeadingNoneCount - iDaysInMonth;
        const aLeadingNoneBox = _.times(iLeadingNoneCount).map(() => this.getBoxObject({ classNames: 'None' })) ?? [];
        const aTrailingNoneBox = _.times(iTrailingNoneCount).map(() => this.getBoxObject({ classNames: 'None' })) ?? [];

        return [
          this.getBoxObject({ label: _.toUpper(dFirstDayOfYear.format('MMM')), classNames: 'Header' }), //
          ...aLeadingNoneBox,
          ..._.times(iDaysInMonth).map((d, i) => this.getActivationDayBody(month, i + 1)),
          ...aTrailingNoneBox,
        ];
      },

      getBoxObject({ day = 'NONE', label = '', classNames = '', borderNames = 'Default', stripes = 'None' }) {
        return { day, label, classNames, borderNames, stripes };
      },

      getWeekHeader() {
        const aWeekNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const mWeekHeaders = aWeekNames.map((o) => this.getBoxObject({ label: o, classNames: 'Header' }));

        return [this.getBoxObject({ label: 'Month', classNames: 'Header' }), ...mWeekHeaders, ...mWeekHeaders, ...mWeekHeaders, ...mWeekHeaders, ...mWeekHeaders, this.getBoxObject({ label: 'M', classNames: 'Header' }), this.getBoxObject({ label: 'T', classNames: 'Header' })];
      },

      getActivationDayBody(iMonth, iDay) {
        const oViewModel = this.oController.getViewModel();
        const oScheduleData = oViewModel.getProperty('/yearPlan');
        const iYear = oViewModel.getProperty('/year');
        const dDate = moment({ y: iYear, M: iMonth, d: iDay });
        const sFormatDate = dDate.format('YYYYMMDD');
        const iDayNum = dDate.day();
        let sClassNames = '';
        let sBorderNames = 'Default';
        let sStripes = 'None';

        if (iDayNum % 6 === 0) {
          sClassNames = 'Weekend';
        } else {
          sClassNames = 'Normal';
        }

        if (moment().isSame(dDate, 'day')) {
          sBorderNames = 'Today';
        }

        const oDateObject = _.filter(oScheduleData, (e) => {
          return e.FullDate === sFormatDate;
        });

        if (!_.isEmpty(oDateObject[0].Colty)) {
          sClassNames = oDateObject[0].Colty;
        }
        // sStripes = oDateObject[0].inProgress;

        return this.getBoxObject({ day: sFormatDate, label: String(iDay), classNames: sClassNames, borderNames: sBorderNames, stripes: sStripes });
      },
    });
  }
);
