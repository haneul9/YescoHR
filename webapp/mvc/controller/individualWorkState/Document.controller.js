/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/individualWorkState/YearPlanBoxHandler',
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.individualWorkState.Document', {
      sCombiChartId: 'combiChart',
      sDoughChartId: 'doughChart',
      sDialChartId: 'WeekWorkDialChart',
      sDialChartDiv: 'chart-weekWork-app-dial-container',

      initializeModel() {
        return {
          FullYear: '',
          pernr: '',
          year: moment().get('year'),
          month: moment().get('month'),
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          WeekWorkDate: new Date(),
          appointee: {},
          MonthStrList: [],
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
          week: { busy: false },
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
          VacaTypeList1: [],
          VacaTypeList2: [],
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

      weekTimeFormat(sTime1, sTime2) {
        return !sTime1 || !sTime2 ? '0' : `${sTime1.slice(-4, -2)}:${sTime1.slice(-2)} ~ ${sTime2.slice(-4, -2)}:${sTime2.slice(-2)}`;
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setSizeLimit(500);
        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        setTimeout(() => $('#container-ehr---app--app').addClass('popup-body'), 200);

        try {
          const sWerks = this.getAppointeeProperty('Werks');
          const sPernr = oParameter.pernr ?? this.getAppointeeProperty('Pernr');
          const sYear = oParameter.year ?? moment().get('year');
          const sMonth = oParameter.month ?? moment().get('month');

          oViewModel.setProperty('/pernr', sPernr);
          oViewModel.setProperty('/year', _.toNumber(sYear));
          oViewModel.setProperty('/month', _.toNumber(sMonth));
          oViewModel.setProperty('/WeekWorkDate', oParameter.year ? moment().year(_.toNumber(sYear)).month(_.toNumber(sMonth)).toDate() : new Date());

          this.YearPlanBoxHandler = new YearPlanBoxHandler({ oController: this, sPernr });

          this.setAppointee(sPernr);
          this.setMonth(sMonth);
          this.formYear(sYear);

          oViewModel.setProperty(
            '/MonthStrList',
            _.times(12, (e) => {
              return { label: `${e + 1}${this.getBundleText('LABEL_00253')}` }; // 월
            })
          );

          this.YearPlanBoxHandler.getYearPlan(sYear);

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

          const aFilterVacaList = _.remove(aVacaTypeList, (e) => {
            return _.parseInt(e.Ktart) > 20;
          });

          oViewModel.setProperty('/VacaTypeList1', aVacaTypeList);
          oViewModel.setProperty('/VacaTypeList2', aFilterVacaList);

          const sWorkMonth = oViewModel.getProperty('/WorkMonth');
          // 근무현황
          const mTablePayLoad = {
            Werks: sWerks,
            Pernr: sPernr,
            Tmyea: sYear,
            Month: sWorkMonth,
          };

          // 근무현황 -> 근무일수
          const aWorkList = await Client.getEntitySet(oModel, 'WorkingStatus', mTablePayLoad);

          oViewModel.setProperty('/MonthWorkList', aWorkList);

          // 근무현황 -> OT현황
          const aOTList = await Client.getEntitySet(oModel, 'OvertimeStatus', mTablePayLoad);

          oViewModel.setProperty('/OTWorkList', aOTList);

          const mWeekWorkPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
            Datum: moment(oViewModel.getProperty('/WeekWorkDate')).hours(9).toDate(),
          };

          // 주 52시간 현황
          const [mWeekTime] = await Client.getEntitySet(oModel, 'WorkingTime', mWeekWorkPayLoad);

          this.buildDialChart(mWeekTime);
          oViewModel.setProperty('/WeekWork', mWeekTime);

          // 근태유형 Combo
          const aWorkTypeCodeList = await Client.getEntitySet(oModel, 'AwartCodeList');
          const sCode = '2000';

          oViewModel.setProperty('/WorkTypeUseList', aWorkTypeCodeList);
          oViewModel.setProperty('/WorkTypeUse', sCode);

          const mWorkTypePayLoad = {
            Werks: sWerks,
            Pernr: sPernr,
            Awart: sCode,
            Tmyea: sYear,
          };

          // 근태유형 별 연간 사용현황
          const aWorkTypeList = await Client.getEntitySet(oModel, 'TimeUsageGraph', mWorkTypePayLoad);

          // Combination Chart
          this.buildCombiChart(aWorkTypeList);

          const mDailyWorkPayLoad = {
            Werks: sWerks,
            Pernr: sPernr,
            Tmyea: sYear,
          };

          // 일별 근태현황
          const aDailyList = await Client.getEntitySet(oModel, 'ApprTimeList', mDailyWorkPayLoad);
          const aAddNum = [];

          aDailyList.forEach((e, i) => {
            aAddNum.push({ ...e, No: i + 1 });
          });

          const iLength = aDailyList.length;

          oViewModel.setProperty('/DailyWorkList', aAddNum);
          oViewModel.setProperty('/DailyWorkCount', iLength > 10 ? 10 : iLength);
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          sap.ui.getCore().byId('container-ehr---app--appMenuToolbar').setVisible(false);
          oViewModel.setProperty('/busy', false);
          AppUtils.setAppBusy(false).setMenuBusy(false);
        }
      },

      async setAppointee(sPernr) {
        const oViewModel = this.getViewModel();

        if (_.isEqual(sPernr, this.getAppointeeProperty('Pernr'))) {
          oViewModel.setProperty('/appointee', AppUtils.getAppComponent().getAppointeeModel().getData());
        } else {
          const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Ename: sPernr,
          });

          oViewModel.setProperty('/appointee', { ...mAppointee, Orgtx: mAppointee.Fulln, Photo: mAppointee.Photo || this.getUnknownAvatarImageURL() });
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
              width: '40%',
              height: '100%',
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

      // Dough Rerendering
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

      // Combination Chart Setting
      getCombiChartOption() {
        return {
          //Cosmetics
          bgColor: 'transparent',
          theme: 'ocean',
          usePlotGradientColor: 0,
          showDivLineSecondaryValue: 0,
          showSecondaryLimits: 0,
          showPlotBorder: 0,
          baseFontSize: 13,
          valueFontSize: 13,
          legendItemFontSize: 13,
          showXAxisLine: 0,
          animation: 1,
          divLineColor: '#dde1e6',
          divLineDashed: 0,
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: 1,
          plotcolorintooltip: 1,
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
        };
      },

      buildCombiChart(aWorkTypeList) {
        const oDetailModel = this.getViewModel();

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

        if (!FusionCharts(this.sCombiChartId)) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: this.sCombiChartId,
              type: 'mscombidy2d',
              renderAt: 'chart-combination-container',
              width: '100%',
              height: '300px',
              dataFormat: 'json',
              dataSource: {
                chart: this.getCombiChartOption(),
                categories: [
                  {
                    category: oDetailModel.getProperty('/MonthStrList'),
                  },
                ],
                dataset: [
                  {
                    seriesName: this.getBundleText('LABEL_16005'),
                    labelFontSize: '13',
                    data: aWorkTypeList.Monuse,
                    color: '#7bb4eb',
                  },
                  {
                    seriesName: this.getBundleText('LABEL_00196'),
                    labelFontSize: '13',
                    renderAs: 'line',
                    data: aWorkTypeList.Current,
                    color: '#000000',
                    anchorBgColor: '#000000',
                    anchorRadius: '3',
                    lineThickness: '1',
                  },
                ],
              },
            }).render();
          });
        } else {
          const oChart = FusionCharts(this.sCombiChartId);

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
                  labelFontSize: '13',
                  data: aWorkTypeList.Monuse,
                  color: '#7bb4eb',
                },
                {
                  seriesName: this.getBundleText('LABEL_00196'),
                  labelFontSize: '13',
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
          setTimeout(() => oChart.render(), 200);
        }
      },

      // Combination Rerendering
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

      // WeekWorkTime Chart
      getDialChartOption(iGaugeOriginY) {
        return {
          //Cosmetics
          showValue: 1,
          baseFontSize: 14,
          valueFontSize: 14,
          showTooltip: 0,
          gaugeOriginY: iGaugeOriginY,
          gaugeOuterRadius: 150,
          gaugeInnerRadius: 110,
          majorTMNumber: 13,
          majorTMColor: '#333',
          majorTMHeight: -2.5,
          majorTMThickness: 1,
          tickValueDistance: 5,
          tickValueStep: 10,
          showPlotBorder: 0,
          showGaugeBorder: 0,
          showPivotBorder: 0,
          bgColor: 'transparent',
          pivotRadius: 3,
          pivotFillColor: '#000',
          theme: 'ocean',
          paletteThemeColor: 'transparent',
        };
      },

      buildDialChart(mWorkTypeList) {
        const oChart = FusionCharts(this.sDialChartId);
        const iGaugeOriginY = 225; // 150 + 75 : (chart box height 50%) + (chart real height 50%)

        if (!oChart) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: this.sDialChartId,
              type: 'angulargauge',
              renderAt: this.sDialChartDiv,
              width: '350px',
              height: '300px',
              dataFormat: 'json',
              dataSource: {
                chart: this.getDialChartOption(iGaugeOriginY),
                colorrange: {
                  color: [
                    {
                      minvalue: '0',
                      maxvalue: mWorkTypeList.Alwtm,
                      code: '#34649d',
                    },
                    {
                      minvalue: mWorkTypeList.Alwtm,
                      maxvalue: mWorkTypeList.Maxtm,
                      code: '#fdde17',
                    },
                  ],
                },
                dials: {
                  dial: [
                    {
                      value: mWorkTypeList.Reltm,
                      valueY: iGaugeOriginY + 13,
                      baseWidth: 4,
                      rearExtension: 0,
                    },
                  ],
                },
              },
            }).render();
          });
        } else {
          oChart.setChartData(
            {
              chart: this.getDialChartOption(iGaugeOriginY),
              colorrange: {
                color: [
                  {
                    minvalue: '0',
                    maxvalue: mWorkTypeList.Alwtm,
                    code: '#34649d',
                  },
                  {
                    minvalue: mWorkTypeList.Alwtm,
                    maxvalue: mWorkTypeList.Maxtm,
                    code: '#fdde17',
                  },
                ],
              },
              dials: {
                dial: [
                  {
                    value: mWorkTypeList.Reltm,
                    valueY: iGaugeOriginY + 13,
                    baseWidth: 4,
                    rearExtension: 0,
                  },
                ],
              },
            },
            'json'
          );
          oChart.render();
        }
      },

      getFormatFloat(sVal = '0') {
        return parseFloat(sVal);
      },

      setMonth(sMonth = moment().month()) {
        const oViewModel = this.getViewModel();
        const aMonth = [];

        for (let i = 1; i < 13; i++) {
          aMonth.push({ Zcode: i, Ztext: i + this.getBundleText('LABEL_00253') }); // 월
        }

        oViewModel.setProperty('/WorkMonths', aMonth);
        oViewModel.setProperty('/WorkMonth', _.toNumber(sMonth) + 1);
      },

      // 근무현황 월 선택
      async onWorkMonth() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mPayLoad = {
          Werks: this.getAppointeeProperty('Werks'),
          Pernr: oViewModel.getProperty('/pernr'),
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

        try {
          oViewModel.setProperty('/week/busy', true);

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mWeekWorkPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: oViewModel.getProperty('/pernr'),
            Datum: moment(oViewModel.getProperty('/WeekWorkDate')).hours(9).toDate(),
          };
          // 주 52시간 현황
          const [mWeekTime] = await Client.getEntitySet(oModel, 'WorkingTime', mWeekWorkPayLoad);

          this.buildDialChart(mWeekTime);
          oViewModel.setProperty('/WeekWork', mWeekTime);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/week/busy', false);
        }
      },

      // 근태유형별 연간사용현황 Combo
      async onWorkTypeUse(oEvent) {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mPayLoad = {
          Werks: this.getAppointeeProperty('Werks'),
          Pernr: oViewModel.getProperty('/pernr'),
          Awart: oEvent.getSource().getSelectedKey(),
          Tmyea: oViewModel.getProperty('/year'),
        };

        // 근태유형 별 연간 사용현황
        const aWorkTypeList = await Client.getEntitySet(oModel, 'TimeUsageGraph', mPayLoad);

        // Combination Chart
        this.setCombiChartData(aWorkTypeList);
      },

      // 년도 선택시 화면전체 년도
      formYear(sYear = moment().year()) {
        return this.getViewModel().setProperty('/FullYear', `${sYear}${this.getBundleText('LABEL_00252')}`); // 년
      },

      // 년도 선택시 화면전체조회
      async formRefresh() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const sWerks = this.getAppointeeProperty('Werks');
          const sPernr = oViewModel.getProperty('/pernr');
          const sYear = oViewModel.getProperty('/year');

          // 휴가계획현황
          const mPayLoad = {
            Werks: sWerks,
            Pernr: sPernr,
            Tmyea: sYear,
          };

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const [aPlanList] = await Client.getEntitySet(oModel, 'LeavePlan', mPayLoad);

          // Doughnut Chart
          this.setDoughChartData(aPlanList);

          // 휴가유형 별 현황
          const aVacaTypeList = await Client.getEntitySet(oModel, 'AbsQuotaList', {
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
          });
          const aFilterVacaList = _.remove(aVacaTypeList, (e) => {
            return _.parseInt(e.Ktart) > 20;
          });

          oViewModel.setProperty('/VacaTypeList1', aVacaTypeList);
          oViewModel.setProperty('/VacaTypeList2', aFilterVacaList);

          const sMonth = oViewModel.getProperty('/WorkMonth');
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

          // 근태유형 Combo
          const aWorkTypeCodeList = await Client.getEntitySet(oModel, 'AwartCodeList');
          const sCode = '2000';

          oViewModel.setProperty('/WorkTypeUseList', aWorkTypeCodeList);
          oViewModel.setProperty('/WorkTypeUse', sCode);

          const mWorkTypePayLoad = {
            Werks: sWerks,
            Pernr: sPernr,
            Awart: sCode,
            Tmyea: sYear,
          };

          // 근태유형 별 연간 사용현황
          const aWorkTypeList = await Client.getEntitySet(oModel, 'TimeUsageGraph', mWorkTypePayLoad);

          // Combination Chart
          this.setCombiChartData(aWorkTypeList);

          const mDailyWorkPayLoad = {
            Werks: sWerks,
            Pernr: sPernr,
            Tmyea: sYear,
          };

          // 일별 근태현황
          const aDailyList = await Client.getEntitySet(oModel, 'ApprTimeList', mDailyWorkPayLoad);
          const aAddNum = [];

          aDailyList.forEach((e, i) => {
            aAddNum.push({ ...e, No: i + 1 });
          });

          oViewModel.setProperty('/DailyWorkList', aAddNum);
          oViewModel.setProperty('/DailyWorkCount', aDailyList.length);
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
        this.YearPlanBoxHandler.onPressPrevYear();
        this.formYear(this.getViewModel().getProperty('/year'));
        this.formRefresh();
      },

      onPressNextYear() {
        this.YearPlanBoxHandler.onPressNextYear();
        this.formYear(this.getViewModel().getProperty('/year'));
        this.formRefresh();
      },

      onClickDay(oEvent) {
        this.YearPlanBoxHandler.onClickDay(oEvent);
      },
    });
  }
);