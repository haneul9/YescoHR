sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    BaseController,
    AppUtils
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.zample.YearPlan', {
      onBeforeShow() {
        const oViewModel = new JSONModel({
          year: 2021,
          plans: [],
          data: {
            20220204: { type: 'Type01', inProgress: 'None' },
            20220512: { type: 'Type02', inProgress: 'None' },
            20220728: { type: 'Type03', inProgress: 'OK' },
            20220908: { type: 'Type04', inProgress: 'None' },
            20221121: { type: 'Type05', inProgress: 'None' },
            20210204: { type: 'Type01', inProgress: 'None' },
            20210510: { type: 'Type02', inProgress: 'None' },
            20210511: { type: 'Type02', inProgress: 'None' },
            20210512: { type: 'Type02', inProgress: 'None' },
            20210513: { type: 'Type02', inProgress: 'None' },
            20210514: { type: 'Type02', inProgress: 'None' },
            20210728: { type: 'Type03', inProgress: 'OK' },
            20210915: { type: 'Type04', inProgress: 'None' },
            20211125: { type: 'Type05', inProgress: 'None' },
            20211130: { type: 'Type05', inProgress: 'OK' },
            20200219: { type: 'Type01', inProgress: 'None' },
            20200402: { type: 'Type02', inProgress: 'None' },
            20200831: { type: 'Type03', inProgress: 'OK' },
            20201013: { type: 'Type04', inProgress: 'None' },
            20201208: { type: 'Type05', inProgress: 'None' },
          },
        });

        oViewModel.setSizeLimit(500);
        this.setViewModel(oViewModel);
      },

      onAfterShow() {
        try {
          const oViewModel = this.getViewModel();

          oViewModel.setProperty('/year', moment().year());

          this.makeCalendarControl();
        } catch (oError) {
          this.debug('Controller > YearPlan > onBeforeShow Error', oError);

          AppUtils.handleError(oError);
        } finally {
          BaseController.prototype.onAfterShow.call(this);
        }
      },

      onPressPrevYear() {
        const oViewModel = this.getViewModel();
        const iCurrentYear = oViewModel.getProperty('/year');

        oViewModel.setProperty('/year', iCurrentYear - 1);

        this.makeCalendarControl();
      },

      onPressNextYear() {
        const oViewModel = this.getViewModel();
        const iCurrentYear = oViewModel.getProperty('/year');

        oViewModel.setProperty('/year', iCurrentYear + 1);

        this.makeCalendarControl();
      },

      onMouseOverDayBox(oDayBox) {
        console.log(oDayBox.getCustomData()[0].getValue());
      },
      onMouseOutDayBox(oDayBox) {
        console.log(oDayBox.getCustomData()[0].getValue());
      },

      makeCalendarControl() {
        const oViewModel = this.getViewModel();
        const mBody = Array.from(Array(12).keys()).map((d, i) => this.getWeekBody(i));

        oViewModel.setProperty('/plans', [...this.getWeekHeader(), ...mBody.reduce((a, b) => [...a, ...b], [])]);
      },

      getBoxObject({ day = 'NONE', label = '', classNames = '', borderNames = 'Default', stripes = 'None' }) {
        return { day, label, classNames, borderNames, stripes };
      },

      getWeekHeader() {
        const aWeekNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const mWeekHeaders = aWeekNames.map((o) => this.getBoxObject({ label: o, classNames: 'Header' }));

        return [
          this.getBoxObject({ label: 'Month', classNames: 'Header' }),
          ...mWeekHeaders,
          ...mWeekHeaders,
          ...mWeekHeaders,
          ...mWeekHeaders,
          ...mWeekHeaders,
          this.getBoxObject({ label: 'M', classNames: 'Header' }),
          this.getBoxObject({ label: 'T', classNames: 'Header' }),
        ];
      },

      getWeekBody(month) {
        const oViewModel = this.getViewModel();
        const iYear = oViewModel.getProperty('/year');
        const dFirstDayOfYear = moment({ y: iYear, M: month, d: 1 });
        const iDaysInMonth = dFirstDayOfYear.daysInMonth();
        const iFirstDay = dFirstDayOfYear.day();
        const iLeadingNoneCount = iFirstDay === 0 ? 6 : iFirstDay - 1;
        const iTrailingNoneCount = 37 - iLeadingNoneCount - iDaysInMonth;
        const aLeadingNoneBox = Array.from(Array(iLeadingNoneCount).keys()).map(() => this.getBoxObject({ classNames: 'None' })) ?? [];
        const aTrailingNoneBox = Array.from(Array(iTrailingNoneCount).keys()).map(() => this.getBoxObject({ classNames: 'None' })) ?? [];

        return [
          this.getBoxObject({ label: _.toUpper(dFirstDayOfYear.format('MMM')), classNames: 'Header' }),
          ...aLeadingNoneBox,
          ...Array.from(Array(iDaysInMonth).keys()).map((d, i) => this.getActivationDayBody(month, i + 1)),
          ...aTrailingNoneBox,
        ];
      },

      getActivationDayBody(iMonth, iDay) {
        const oViewModel = this.getViewModel();
        const oScheduleData = oViewModel.getProperty('/data');
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

        if (!_.isEmpty(oScheduleData[sFormatDate])) {
          sClassNames = oScheduleData[sFormatDate].type;
          sStripes = oScheduleData[sFormatDate].inProgress;
        }

        return this.getBoxObject({ day: sFormatDate, label: String(iDay), classNames: sClassNames, borderNames: sBorderNames, stripes: sStripes });
      },
    });
  }
);
