/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/individualWorkState/YearPlanBoxHandler',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController,
    YearPlanBoxHandler,
    Date,
    Currency
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.individualWorkState.IndiWorkState', {
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          year: moment().year(),
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          WeekWorkDate: new Date(),
          WeekWork: {
            Wkrultx: '',
            WeekTime: 52,
            Tottime: 0,
            Bastime: 0,
            Ottime: 0,
            WorkTime: 0,
          },
          yearPlan: [],
          plans: [],
          PlanMonths: [],
          WorkMonths: [],
          VacaTypeList1: [],
          VacaTypeList2: [],
          vacationChart: {
            dUsed: 0,
            dPlan: 0,
            dUnPlan: 0,
            pUsed: 0,
            pPlan: 0,
            pUnPlan: 0,
            Month: moment().month() + 1,
          },
          busy: false,
        });

        oViewModel.setSizeLimit(500);
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          this.YearPlanBoxHandler ||= new YearPlanBoxHandler({ oController: this });
          this.setMonth();
          const oModel = this.getModel(ServiceNames.WORKTIME);

          // 근태유형 색상
          const aList1 = await Client.getEntitySet(oModel, 'TimeTypeLegend', { Werks: this.getAppointeeProperty('Werks') });

          this.YearPlanBoxHandler.getYearPlan();

          const sWerks = this.getAppointeeProperty('Werks');
          const sYear = oViewModel.getProperty('/year');

          // 휴가계획현황
          const mPayLoad = {
            Werks: sWerks,
            Tmyea: sYear,
          };

          const aPlanList = await Client.getEntitySet(oModel, 'LeavePlan', mPayLoad);

          oViewModel.setProperty('/vacationChart', {
            dUsed: parseInt(aPlanList[0].Cnt01),
            dPlan: parseInt(aPlanList[0].Cnt02),
            dUnPlan: parseInt(aPlanList[0].Cnt03),
            pUsed: parseFloat(aPlanList[0].Rte01),
            pPlan: parseFloat(aPlanList[0].Rte02),
            pUnPlan: parseFloat(aPlanList[0].Rte03),
          });

          // 휴가유형 별 현황
          const aVacaTypeList = await Client.getEntitySet(oModel, 'AbsQuotaList', { Menid: this.getCurrentMenuId() });

          oViewModel.setProperty('/VacaTypeList1', aVacaTypeList.slice(0, 4));

          if (aVacaTypeList.length > 3) {
            oViewModel.setProperty('/VacaTypeList2', aVacaTypeList.slice(4));
          }

          const sMonth = oViewModel.getProperty('/WorkMonth');
          // 근무현황
          const mTablePayLoad = {
            Werks: sWerks,
            Tmyea: sYear,
            Month: sMonth,
          };

          // 근무현황 -> 근무일수
          const aWorkList = await Client.getEntitySet(oModel, 'WorkingStatus', mTablePayLoad);

          oViewModel.setProperty('/MonthWorkList', aWorkList);

          // 근무현황 -> OT현황
          const aOTList = await Client.getEntitySet(oModel, 'OvertimeStatus', mTablePayLoad);

          oViewModel.setProperty('/OTWorkList', aOTList);

          const mWeekWorkPayLoad = {
            Werks: sWerks,
            Datum: moment(oViewModel.getProperty('/WeekWorkDate')).hours(9).toDate(),
          };

          // 주 52시간 현황
          const aWeekTime = await Client.getEntitySet(oModel, 'WorkLimitStatus', mWeekWorkPayLoad);

          oViewModel.setProperty('/WeekWork/Wkrultx', aWeekTime[0].Wkrultx);
          oViewModel.setProperty('/WeekWork/Tottime', parseFloat(aWeekTime[0].Tottime));
          oViewModel.setProperty('/WeekWork/Bastime', parseFloat(aWeekTime[0].Bastime));
          oViewModel.setProperty('/WeekWork/Ottime', parseFloat(aWeekTime[0].Ottime));
          oViewModel.setProperty('/WeekWork/WorkTime', `${aWeekTime[0].Beguz} ~ ${aWeekTime[0].Enduz} (${aWeekTime[0].Stdaz}${this.getBundleText('LABEL_00330')})`);

          debugger;
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      getFormatFloat(sVal = '0') {
        return parseFloat(sVal);
      },

      setMonth() {
        const oViewModel = this.getViewModel();
        const aMonth = [];

        for (let i = 1; i < 13; i++) {
          aMonth.push({ Zcode: i, Ztext: i + this.getBundleText('LABEL_00253') });
        }

        oViewModel.setProperty('/PlanMonths', aMonth);
        oViewModel.setProperty('/PlanMonth', moment().month() + 1);
        oViewModel.setProperty('/WorkMonths', aMonth);
        oViewModel.setProperty('/WorkMonth', moment().month() + 1);
      },

      // 근무현황 월 선택
      async onWorkMonth() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mPayLoad = {
          Werks: this.getAppointeeProperty('Werks'),
          Tmyea: oViewModel.getProperty('/year'),
          Month: oViewModel.getProperty('/WorkMonth'),
        };
        const aWorkList = await Client.getEntitySet(oModel, 'WorkingStatus', mPayLoad);

        oViewModel.setProperty('/MonthWorkList', aWorkList);

        const aOTList = await Client.getEntitySet(oModel, 'OvertimeStatus', mPayLoad);

        oViewModel.setProperty('/OTWorkList', aOTList);
      },

      // 주 52시간 현황 날짜선택
      async onWeekWorkTime() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mWeekWorkPayLoad = {
          Werks: this.getAppointeeProperty('Werks'),
          Datum: moment(oViewModel.getProperty('/WeekWorkDate')).hours(9).toDate(),
        };

        // 주 52시간 현황
        const aWeekTime = await Client.getEntitySet(oModel, 'WorkLimitStatus', mWeekWorkPayLoad);

        oViewModel.setProperty('/WeekWork/Wkrultx', aWeekTime[0].Wkrultx);
        oViewModel.setProperty('/WeekWork/Tottime', parseFloat(aWeekTime[0].Tottime));
        oViewModel.setProperty('/WeekWork/Bastime', parseFloat(aWeekTime[0].Bastime));
        oViewModel.setProperty('/WeekWork/Ottime', parseFloat(aWeekTime[0].Ottime));
        oViewModel.setProperty('/WeekWork/WorkTime', `${aWeekTime[0].Beguz} ~ ${aWeekTime[0].Enduz} (${aWeekTime[0].Stdaz}${this.getBundleText('LABEL_00330')})`);
      },

      getCurrentLocationText(oArguments) {
        return this.getBundleText('LABEL_18001');
      },

      onPressPrevYear() {
        this.YearPlanBoxHandler.onPressPrevYear();
      },

      onPressNextYear() {
        this.YearPlanBoxHandler.onPressNextYear();
      },

      onMouseOverDayBox() {
        this.YearPlanBoxHandler.onMouseOverDayBox();
      },

      onMouseOutDayBox() {
        this.YearPlanBoxHandler.onMouseOutDayBox();
      },
    });
  }
);
