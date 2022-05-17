/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/individualWorkState/mobile/YearPlanBoxHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    YearPlanBoxHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.individualWorkState.mobile.IndiWorkState', {
      sCombiChartId: 'combiChart',
      sDoughChartId: 'doughChart1',

      initializeModel() {
        return {
          FullYear: '',
          pernr: '',
          full: moment().format('YYYY.MM'),
          month: moment().format('MM'),
          year: moment().format('YYYY'),
          appointee: {},
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          WeekWorkDate: new Date(),
          MonthStrList: [],
          DailyWorkList: [],
          YearPlan: [
            {
              title: '',
              detail: [
                {
                  Atext1: '',
                  Appsttx1: '',
                  Ename: '',
                  Ename: '',
                },
              ],
            },
          ],
          WeekWork: {
            Wkrultx: '',
            WeekTime: 52,
            Tottime: 0,
            Bastime: 0,
            Ottime: 0,
            WorkTime: 0,
          },
          TimeTypes: {},
          DailyWorkList: [],
          DailyWorkCount: 1,
          yearPlan: [],
          plans: [],
          WorkMonths: [],
          VacaTypeList: [],
          WorkTypeUseList: [],
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
        };
      },

      formatTime(sTime = '') {
        return !sTime ? '0' : `${sTime.slice(-4, -2)}:${sTime.slice(-2)}`;
      },

      formatZeroTime(sValue = '0') {
        return parseFloat(sValue) === 0 ? '0' : sValue;
      },

      formatDate(dBegDa, dEndDa) {
        const sBe = dBegDa ? moment(dBegDa).format('YYYY.MM.DD') : '';
        const sEn = dEndDa ? `~${moment(dEndDa).format('YYYY.MM.DD')}` : '';
        let sDateRange = `${sBe}${sEn}`;

        if (moment(dBegDa).format('YYYY.MM.DD') === moment(dEndDa).format('YYYY.MM.DD')) {
          sDateRange = sBe;
        }

        return sDateRange;
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setSizeLimit(500);
        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          const sPernr = oParameter.pernr ?? this.getAppointeeProperty('Pernr');
          const sYear = oParameter.year ?? moment().get('year');
          const sMonth = _.parseInt(oParameter.month ?? moment().get('month')) + 1;

          oViewModel.setProperty('/pernr', sPernr);
          oViewModel.setProperty('/year', _.toNumber(sYear));
          oViewModel.setProperty('/month', _.toNumber(sMonth));
          oViewModel.setProperty('/WeekWorkDate', oParameter.year ? moment().year(_.toNumber(sYear)).month(_.toNumber(sMonth)).toDate() : new Date());

          this.YearPlanBoxHandler = this.YearPlanBoxHandler || new YearPlanBoxHandler({ oController: this, sPernr });
          // this.setMonth();
          this.formYear();

          oViewModel.setProperty(
            '/MonthStrList',
            _.times(12, (e) => {
              return { label: `${e + 1}${this.getBundleText('LABEL_00253')}` }; // 월
            })
          );

          this.YearPlanBoxHandler.getYearPlan();
          this.setAppointeeDate();

          const sWerks = this.getAppointeeProperty('Werks');

          // 휴가계획현황
          const mPayLoad = {
            Werks: sWerks,
            Pernr: sPernr,
            Tmyea: sYear,
          };

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const [aPlanList] = await Client.getEntitySet(oModel, 'LeavePlan', mPayLoad);

          // Doughnut Chart
          this.buildDoughChart(aPlanList);

          // 휴가유형 별 현황
          const aVacaTypeList = await Client.getEntitySet(oModel, 'AbsQuotaList', {
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
          });

          oViewModel.setProperty('/VacaTypeList', aVacaTypeList);
          // 근무현황
          const mTablePayLoad = {
            Werks: sWerks,
            Pernr: sPernr,
            Tmyea: sYear,
            Month: sMonth,
          };

          // 근무현황 -> 근무일수
          const aWorkList = await Client.getEntitySet(oModel, 'WorkingStatus', mTablePayLoad);

          oViewModel.setProperty('/MonthWorkList', aWorkList);

          // 근무현황 -> OT현황
          const aOTList = await Client.getEntitySet(oModel, 'OvertimeStatus', mTablePayLoad);

          oViewModel.setProperty('/OTWorkList', aOTList);

          // 주 52시간 현황
          const [aWeekTime] = await Client.getEntitySet(oModel, 'WorkLimitStatus', {
            Werks: sWerks,
            Pernr: sPernr,
            Datum: moment(oViewModel.getProperty('/WeekWorkDate')).hours(9).toDate(),
          });

          oViewModel.setProperty('/WeekWork/Wkrultx', aWeekTime.Wkrultx);
          oViewModel.setProperty('/WeekWork/Tottime', parseFloat(aWeekTime.Tottime));
          oViewModel.setProperty('/WeekWork/Bastime', parseFloat(aWeekTime.Bastime));
          oViewModel.setProperty('/WeekWork/Ottime', parseFloat(aWeekTime.Ottime));
          oViewModel.setProperty('/WeekWork/Grp03', parseFloat(aWeekTime.Grp03));
          oViewModel.setProperty('/WeekWork/Grp01', parseFloat(aWeekTime.Grp01));
          oViewModel.setProperty('/WeekWork/Grp02', parseFloat(aWeekTime.Grp02));
          oViewModel.setProperty('/WeekWork/WorkTime', `${this.formatTime(aWeekTime.Beguz)} ~ ${this.formatTime(aWeekTime.Enduz)} (${aWeekTime.Stdaz}${this.getBundleText('LABEL_00330')})`);

          // 일별 근태현황
          const aDailyList = await Client.getEntitySet(oModel, 'ApprTimeList', {
            Werks: sWerks,
            Pernr: sPernr,
            Tmyea: sYear,
          });

          oViewModel.setProperty('/DailyWorkList', aDailyList);
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Doughnut Chart Setting
      getDoughnutChartOption() {
        return {
          legendPosition: 'right',
          bgColor: 'transparent',
          theme: 'ocean',
          plottooltext: `$label $value일`,
          animation: 1,
          slicingDistance: 0,
          smartLineAlpha: 0,
          captionPadding: 0,
          chartLeftMargin: 0,
          chartRightMargin: 0,
          chartBottomMargin: 0,
          chartTopMargin: -10,
          labelFontSize: 12,
        };
      },

      buildDoughChart(aPlanList) {
        const oDetailModel = this.getViewModel();
        const mPlan = {
          dUsed: parseFloat(aPlanList.Cnt01),
          dPlan: parseFloat(aPlanList.Cnt02),
          dUnPlan: parseFloat(aPlanList.Cnt03),
          pUsed: parseFloat(aPlanList.Rte01),
          pPlan: parseFloat(aPlanList.Rte02),
          pUnPlan: parseFloat(aPlanList.Rte03),
        };

        oDetailModel.setProperty('/vacationChart', mPlan);

        if (!FusionCharts(this.sDoughChartId)) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: this.sDoughChartId,
              type: 'doughnut2d',
              renderAt: 'chart-doughnut-container',
              width: '100%',
              height: '150px',
              dataFormat: 'json',
              dataSource: {
                chart: this.getDoughnutChartOption(),
                data: [
                  {
                    label: this.getBundleText('LABEL_18002'), // 사용일수
                    value: mPlan.dUsed,
                    displayValue: `${mPlan.pUsed}%`,
                    color: '#7BB4EB',
                  },
                  {
                    label: this.getBundleText('LABEL_18003'), // 계획일수
                    value: mPlan.dPlan,
                    displayValue: `${mPlan.pPlan}%`,
                    color: '#A2EB7B',
                  },
                  {
                    label: this.getBundleText('LABEL_18004'), // 잔여일수 (미사용&미계획)
                    value: mPlan.dUnPlan,
                    displayValue: `${mPlan.pUnPlan}%`,
                    color: '#FFE479',
                  },
                ],
              },
            }).render();
          });
        } else {
          const oChart = FusionCharts(this.sDoughChartId);

          oChart.setChartData(
            {
              chart: this.getDoughnutChartOption(),
              data: [
                {
                  label: this.getBundleText('LABEL_18002'), // 사용일수
                  value: mPlan.dUsed,
                  displayValue: `${mPlan.pUsed}%`,
                  color: '#7BB4EB',
                },
                {
                  label: this.getBundleText('LABEL_18003'), // 계획일수
                  value: mPlan.dPlan,
                  displayValue: `${mPlan.pPlan}%`,
                  color: '#A2EB7B',
                },
                {
                  label: this.getBundleText('LABEL_18004'), // 잔여일수 (미사용&미계획)
                  value: mPlan.dUnPlan,
                  displayValue: `${mPlan.pUnPlan}%`,
                  color: '#FFE479',
                },
              ],
            },
            'json'
          );
          setTimeout(() => oChart.render(), 200);
        }
      },

      // Dough ReRanderring
      setDoughChartData(aPlanList) {
        const oChart = FusionCharts(this.sDoughChartId);
        const oDetailModel = this.getViewModel();
        const mPlan = {
          dUsed: parseFloat(aPlanList.Cnt01),
          dPlan: parseFloat(aPlanList.Cnt02),
          dUnPlan: parseFloat(aPlanList.Cnt03),
          pUsed: parseFloat(aPlanList.Rte01),
          pPlan: parseFloat(aPlanList.Rte02),
          pUnPlan: parseFloat(aPlanList.Rte03),
        };

        oDetailModel.setProperty('/vacationChart', mPlan);

        oChart.setChartData(
          {
            chart: this.getDoughnutChartOption(),
            data: [
              {
                label: this.getBundleText('LABEL_18002'), // 사용일수
                value: mPlan.dUsed,
                displayValue: `${mPlan.pUsed}%`,
                color: '#7BB4EB',
              },
              {
                label: this.getBundleText('LABEL_18003'), // 계획일수
                value: mPlan.dPlan,
                displayValue: `${mPlan.pPlan}%`,
                color: '#A2EB7B',
              },
              {
                label: this.getBundleText('LABEL_18004'), // 잔여일수 (미사용&미계획)
                value: mPlan.dUnPlan,
                displayValue: `${mPlan.pUnPlan}%`,
                color: '#FFE479',
              },
            ],
          },
          'json'
        );
        oChart.render();
      },

      // Combination ReRanderring
      setCombiChartData(aWorkTypeList) {
        const oDetailModel = this.getViewModel();
        const oChart = FusionCharts(this.sCombiChartId);

        _.chain(aWorkTypeList)
          .set(
            'Current',
            _.map(aWorkTypeList, (e) => {
              return { value: e.Cumuse };
            })
          )
          .set(
            'Monuse',
            _.map(aWorkTypeList, (e) => {
              return { value: e.Monuse };
            })
          )
          .value();

        oChart.setChartData(
          {
            chart: this.getCombiChartOption(),
            categories: [
              {
                category: oDetailModel.getProperty('/MonthStrList'),
              },
            ],
            dataset: [
              {
                seriesName: this.getBundleText('LABEL_16005'),
                data: aWorkTypeList.Monuse,
                color: '#7bb4eb',
              },
              {
                seriesName: this.getBundleText('LABEL_00196'),
                renderAs: 'line',
                data: aWorkTypeList.Current,
                color: '#000000',
                anchorBgColor: '#000000',
                anchorRadius: '3',
                lineThickness: '1',
              },
            ],
          },
          'json'
        );
        oChart.render();
      },

      getFormatFloat(sVal = '0') {
        return parseFloat(sVal);
      },

      setMonth() {
        const oViewModel = this.getViewModel();
        const aMonth = [];

        for (let i = 1; i < 13; i++) {
          aMonth.push({ Zcode: i, Ztext: i + this.getBundleText('LABEL_00253') }); // 월
        }

        oViewModel.setProperty('/WorkMonths', aMonth);
        oViewModel.setProperty('/WorkMonth', moment().month() + 1);
      },

      // 근무현황 월 선택
      async onWorkMonth() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mPayLoad = {
          Werks: this.getAppointeeProperty('Werks'),
          Pernr: oViewModel.getProperty('/pernr'),
          Tmyea: oViewModel.getProperty('/year'),
          Month: oViewModel.getProperty('/month'),
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

        // 주 52시간 현황
        const [aWeekTime] = await Client.getEntitySet(oModel, 'WorkLimitStatus', {
          Werks: this.getAppointeeProperty('Werks'),
          Pernr: oViewModel.getProperty('/pernr'),
          Datum: moment(oViewModel.getProperty('/WeekWorkDate')).hours(9).toDate(),
        });

        oViewModel.setProperty('/WeekWork/Wkrultx', aWeekTime.Wkrultx);
        oViewModel.setProperty('/WeekWork/Tottime', parseFloat(aWeekTime.Tottime));
        oViewModel.setProperty('/WeekWork/Bastime', parseFloat(aWeekTime.Bastime));
        oViewModel.setProperty('/WeekWork/Ottime', parseFloat(aWeekTime.Ottime));
        oViewModel.setProperty('/WeekWork/Grp03', parseFloat(aWeekTime.Grp03));
        oViewModel.setProperty('/WeekWork/Grp01', parseFloat(aWeekTime.Grp01));
        oViewModel.setProperty('/WeekWork/Grp02', parseFloat(aWeekTime.Grp02));
        oViewModel.setProperty('/WeekWork/WorkTime', `${this.formatTime(aWeekTime.Beguz)} ~ ${this.formatTime(aWeekTime.Enduz)} (${aWeekTime.Stdaz}${this.getBundleText('LABEL_00330')})`);
      },

      // 근태유형별 연간사용현황 Combo
      async onWorkTypeUse(oEvent) {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);

        // 근태유형 별 연간 사용현황
        const aWorkTypeList = await Client.getEntitySet(oModel, 'TimeUsageGraph', {
          Werks: this.getAppointeeProperty('Werks'),
          Pernr: oViewModel.getProperty('/pernr'),
          Awart: oEvent.getSource().getSelectedKey(),
          Tmyea: oViewModel.getProperty('/year'),
        });

        // Combination Chart
        this.setCombiChartData(aWorkTypeList);
      },

      // 년도 선택시 화면전체 년도
      formYear() {
        const oViewModel = this.getViewModel();

        return oViewModel.setProperty('/FullYear', `${oViewModel.getProperty('/year')}${this.getBundleText('LABEL_00252')}`); // 년
      },

      // 사원정보
      async setAppointeeDate() {
        try {
          const oModel = this.getModel(ServiceNames.COMMON);
          const mFilters = {
            Ename: this.getViewModel().getProperty('/pernr'),
            Stat2: '3',
            Accty: 'M', // 권한 해제 : 타사 임직원도 검색 + 전화번호
          };

          const aEmployees = await Client.getEntitySet(oModel, 'EmpSearchResult', mFilters);
          const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

          this.getViewModel().setProperty(
            '/appointee',
            aEmployees.map((mEmployee) => {
              mEmployee.Photo = mEmployee.Photo || sUnknownAvatarImageURL;
              return mEmployee;
            })[0]
          );
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      // 년도 선택시 화면전체조회
      async formRefresh(sBeYear) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const sWerks = this.getAppointeeProperty('Werks');
          const sPernr = oViewModel.getProperty('/pernr');
          const sYear = oViewModel.getProperty('/year');
          const sMonth = oViewModel.getProperty('/month');
          // 근무현황
          const mTablePayLoad = {
            Werks: sWerks,
            Pernr: sPernr,
            Tmyea: sYear,
            Month: sMonth,
          };

          // 근무현황 -> 근무일수
          const aWorkList = await Client.getEntitySet(oModel, 'WorkingStatus', mTablePayLoad);

          oViewModel.setProperty('/MonthWorkList', aWorkList);

          // 근무현황 -> OT현황
          const aOTList = await Client.getEntitySet(oModel, 'OvertimeStatus', mTablePayLoad);

          oViewModel.setProperty('/OTWorkList', aOTList);

          if (sBeYear !== sYear) {
            // 휴가계획현황
            const [aPlanList] = await Client.getEntitySet(oModel, 'LeavePlan', {
              Werks: sWerks,
              Pernr: sPernr,
              Tmyea: sYear,
            });

            // Doughnut Chart
            this.setDoughChartData(aPlanList);

            // 휴가유형 별 현황
            const aVacaTypeList = await Client.getEntitySet(oModel, 'AbsQuotaList', {
              Menid: this.getCurrentMenuId(),
              Pernr: sPernr,
            });

            oViewModel.setProperty('/VacaTypeList', aVacaTypeList);

            // 일별 근태현황
            const aDailyList = await Client.getEntitySet(oModel, 'ApprTimeList', {
              Werks: sWerks,
              Pernr: sPernr,
              Tmyea: sYear,
            });

            oViewModel.setProperty('/DailyWorkList', aDailyList);
          }
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },
      getCurrentLocationText() {
        return this.getBundleText('LABEL_18001'); // My Time Calendar
      },

      onPressPrevYear() {
        const sBeYear = _.cloneDeep(this.getViewModel().getProperty('/year'));
        this.YearPlanBoxHandler.onPressPrevYear();
        this.formYear();
        this.formRefresh(sBeYear);
      },

      onPressNextYear() {
        const sBeYear = _.cloneDeep(this.getViewModel().getProperty('/year'));
        this.YearPlanBoxHandler.onPressNextYear();
        this.formYear();
        this.formRefresh(sBeYear);
      },

      onClickDay(oEvent) {
        this.YearPlanBoxHandler.onClickDay(oEvent);
      },
    });
  }
);
