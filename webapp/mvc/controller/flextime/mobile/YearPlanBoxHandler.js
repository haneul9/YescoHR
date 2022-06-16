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
  
      return BaseObject.extend('sap.ui.yesco.mvc.controller.flextime.mobile.YearPlanBoxHandler', {
        constructor: function ({ oController, sPernr }) {
          this.oController = oController;
          this.sPernr = sPernr;
        },
  
        async getYearPlan() {
          const oViewModel = this.oController.getViewModel();
          const oModel = this.oController.getModel(ServiceNames.WORKTIME);
          const sWerks = this.oController.getAppointeeProperty('Werks');
          const mPayLoad = {
            Werks: sWerks,
            Pernr: this.sPernr,
            Tmyea: oViewModel.getProperty('/year'),
            Tmmon: oViewModel.getProperty('/month'),
          };
  
          // 1년근태
          const aList1 = await Client.getEntitySet(oModel, 'PersonalTimeDashboard', mPayLoad);
  
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
          const sFullDa = oViewModel.getProperty('/full').replace('.', '-');
          const sFullDate = moment(sFullDa).subtract(1, 'month').format('YYYY-MM');
  
          oViewModel.setProperty('/year', moment(sFullDate).format('YYYY'));
          oViewModel.setProperty('/month', moment(sFullDate).format('MM'));
          oViewModel.setProperty('/full', sFullDate.replace('-', '.'));
          await this.oController.YearPlanBoxHandler.getYearPlan();
        },
  
        async onPressNextYear() {
          const oViewModel = this.oController.getViewModel();
          const sFullDa = oViewModel.getProperty('/full').replace('.', '-');
          const sFullDate = moment(sFullDa).add(1, 'month').format('YYYY-MM');
  
          oViewModel.setProperty('/year', moment(sFullDate).format('YYYY'));
          oViewModel.setProperty('/month', moment(sFullDate).format('MM'));
          oViewModel.setProperty('/full', sFullDate.replace('-', '.'));
          await this.oController.YearPlanBoxHandler.getYearPlan();
        },
  
        // 요일 선택시
        async onClickDay(oEvent) {
          const oEventSource = oEvent.getSource();
          const oContext = oEventSource.getBindingContext();
          if (!oContext) {
            return;
          }
  
          const oViewModel = this.oController.getViewModel();
          const mSelect = oContext.getProperty();
          const [mSelectedDay] = _.filter(oViewModel.getProperty('/yearPlan'), (e) => {
            return e.FullDate === mSelect.day;
          });
  
          if (!mSelectedDay || (!mSelectedDay.Colty && !mSelectedDay.Ottyp)) {
            return;
          }
  
          oViewModel.setProperty('/YearPlan/detail', mSelectedDay);
          oViewModel.setProperty('/YearPlan/title', moment(mSelectedDay.FullDate).format('YYYY.MM.DD'));
  
          if (!this.oController._oPopover) {
            const oView = this.oController.getView();
  
            this.oController._oPopover = await Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.individualWorkState.mobile.fragment.YearPlanPopover',
              controller: this.oController,
            });
  
            oView.addDependent(this.oController._oPopover);
          }
  
          this.oController._oPopover.openBy(oEventSource);
        },
  
        makeCalendarControl() {
          const oViewModel = this.oController.getViewModel();
          const mBody = _.times(1, this.getWeekBody.bind(this));
  
          oViewModel.setProperty('/plans', [...this.getWeekHeader(), ...mBody.reduce((a, b) => [...a, ...b], [])]);
        },
  
        getWeekBody() {
          const oViewModel = this.oController.getViewModel();
          const iMonth = _.subtract(oViewModel.getProperty('/month'), 1);
          const sYear = oViewModel.getProperty('/year');
          const dFirstDayOfYear = moment({ y: sYear, M: iMonth, d: 1 });
          const iDaysInMonth = dFirstDayOfYear.daysInMonth();
          const iFirstDay = dFirstDayOfYear.day();
          const iLeadingNoneCount = iFirstDay === 0 ? 6 : iFirstDay - 1;
          const iTrailingNoneCount = 35 - iLeadingNoneCount - iDaysInMonth;
          const aLeadingNoneBox = _.times(iLeadingNoneCount).map(() => this.getBoxObject({ classNames: '' })) ?? [];
          const aTrailingNoneBox = _.times(iTrailingNoneCount).map(() => this.getBoxObject({ classNames: '' })) ?? [];
  
          return [...aLeadingNoneBox, ..._.times(iDaysInMonth).map((d, i) => this.getActivationDayBody(i + 1)), ...aTrailingNoneBox];
        },
  
        getBoxObject({ bTime = '', eTime = '', day = 'NONE', label = '', classNames = '', borderNames = 'Default', stripes = 'None', holiday = 'None' }) {
          return { bTime, eTime, day, label, classNames, borderNames, stripes, holiday };
        },
  
        getWeekHeader() {
          const aWeekNames = _.times(7, (e) => {
            return `${this.oController.getBundleText(`LABEL_180${e + 25}`)}`; // 월,화,수,목,금,토,일
          });
          const mWeekHeaders = aWeekNames.map((o, i) => this.getBoxObject({ label: o, holiday: i === 5 || i === 6 ? 'Holiday' : 'None', classNames: 'Day' }));
  
          return [...mWeekHeaders];
        },
  
        getActivationDayBody(iDay) {
          const oViewModel = this.oController.getViewModel();
          const oScheduleData = oViewModel.getProperty('/yearPlan');
          const sYear = oViewModel.getProperty('/year');
          const iMonth = _.subtract(oViewModel.getProperty('/month'), 1);
          const dDate = moment({ y: sYear, M: iMonth, d: iDay });
          const sFormatDate = dDate.format('YYYYMMDD');
          const iDayNum = dDate.day();
          let sClassNames = '';
          let sBorderNames = 'Default';
          let sStripes = 'None';
          let sHoliday = 'None';
  
          if (iDayNum % 6 === 0) {
            sHoliday = 'Holiday';
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
  
          if (!!oDateObject.Ottyp) {
            sClassNames = oDateObject.Ottyp;
          }
  
          if (oDateObject.Cssty === 'P') {
            sStripes = 'Stripes';
          }
  
          let sBeTime = oDateObject.Beguz;
          let sEnTime = oDateObject.Enduz;
  
          if (oDateObject.Wkday === '6' || oDateObject.Wkday === '7' || oDateObject.Holyn === 'X') {
            sBeTime = 'OFF';
            sEnTime = '';
            sHoliday = 'Holiday';
          } else {
            sBeTime = `${sBeTime.slice(0, 2)}:${sBeTime.slice(2)}`;
            sEnTime = `${sEnTime.slice(0, 2)}:${sEnTime.slice(2)}`;
          }
          // sStripes = oDateObject.inProgress;
  
          return this.getBoxObject({ bTime: sBeTime, eTime: sEnTime, day: sFormatDate, label: String(iDay), holiday: sHoliday, classNames: sClassNames, borderNames: sBorderNames, stripes: sStripes });
        },
      });
    }
  );
  