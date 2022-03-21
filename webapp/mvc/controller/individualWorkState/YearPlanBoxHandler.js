sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Fragment,
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

        _.forEach(aTimeTypeList, (e) => {
          oViewModel.setProperty(`/TimeTypes/${e.Colty}`, true);
        });
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

      // 요일 선택시
      onClickDay(oEvent) {
        const oView = this.oController.getView();
        const oViewModel = this.oController.getViewModel();
        const mdate = oEvent.data();
        const [mSelectedDay] = _.filter(oViewModel.getProperty('/yearPlan'), (e) => {
          return e.FullDate === mdate.day;
        });

        if (!mSelectedDay || !mSelectedDay.Colty) {
          return;
        }

        oViewModel.setProperty('/YearPlan/detail', mSelectedDay);
        oViewModel.setProperty('/YearPlan/title', moment(mSelectedDay.FullDate).format('YYYY.MM.DD'));

        if (!this.oController._pPopover) {
          this.oController._pPopover = Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.individualWorkState.fragment.YearPlanPopover',
            controller: this.oController,
          }).then(function (oPopover) {
            oView.addDependent(oPopover);
            return oPopover;
          });
        }
        this.oController._pPopover.then(function (oPopover) {
          oPopover.openBy(oEvent);
        });
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
        const aWeekNames = _.times(7, (e) => {
          return `${this.oController.getBundleText(`LABEL_180${e + 25}`)}`; // 월,화,수,목,금,토,일
        });
        const mWeekHeaders = aWeekNames.map((o) => this.getBoxObject({ label: o, classNames: 'Header' }));

        return [this.getBoxObject({ label: this.oController.getBundleText('LABEL_17005'), classNames: 'Header' }), ...mWeekHeaders, ...mWeekHeaders, ...mWeekHeaders, ...mWeekHeaders, ...mWeekHeaders, this.getBoxObject({ label: this.oController.getBundleText('LABEL_18025'), classNames: 'Header' }), this.getBoxObject({ label: this.oController.getBundleText('LABEL_18026'), classNames: 'Header' })];
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

        const [oDateObject] = _.filter(oScheduleData, (e) => {
          return e.FullDate === sFormatDate;
        });

        if (!_.isEmpty(oDateObject.Colty)) {
          sClassNames = oDateObject.Colty;
        }

        if (oDateObject.Cssty === 'P') {
          sStripes = 'Stripes';
        }
        // sStripes = oDateObject.inProgress;

        return this.getBoxObject({ day: sFormatDate, label: String(iDay), classNames: sClassNames, borderNames: sBorderNames, stripes: sStripes });
      },
    });
  }
);
