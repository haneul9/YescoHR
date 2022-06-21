/* eslint-disable no-useless-call */
sap.ui.define(
    [
      // prettier 방지용 주석
      'sap/ui/core/Fragment',
      'sap/ui/yesco/control/MessageBox',
      'sap/ui/yesco/common/AppUtils',
      'sap/ui/yesco/common/exceptions/UI5Error',
      'sap/ui/yesco/common/odata/Client',
      'sap/ui/yesco/common/odata/ServiceNames',
      'sap/ui/yesco/mvc/controller/BaseController',
    ],
    (
      // prettier 방지용 주석
      Fragment,
      MessageBox,
      AppUtils,
      UI5Error,
      Client,
      ServiceNames,
      BaseController
    ) => {
      'use strict';
  
      return BaseController.extend('sap.ui.yesco.mvc.controller.flextime.mobile.Detail', {
        sAccty: 'E',
  
        initializeModel() {
          return {
            Datum: '',
            initBeguz: moment('0900', 'hhmm').toDate(),
            initEnduz: moment('1800', 'hhmm').toDate(),
            isMss: false,
            isHass: false,
            // busy: {
            //   Button: false,
            //   Dialog: false,
            //   Input: false,
            //   Summary: false,
            //   Details: false,
            // },
            busy: false,
            summary: {
              rowCount: 1,
              Zyymm: "",
              list: [],
            },
            details: {
              rowCount: 9,
              list: [],
            },
            dialog: {
              targetDates: [],
              work: { rowCount: 1, list: [{ Beguz: null, Enduz: null }] },
              legal: { rowCount: 1, list: [{ Beguz: null, Enduz: null }] },
              extra: {
                rowCount: 3,
                list: [
                  { Beguz: null, Enduz: null, Sumrow: false },
                  { Beguz: null, Enduz: null, Sumrow: false },
                  { Beguz: null, Enduz: null, Sumrow: true },
                ],
              },
            },
          };
        },

        getCurrentLocationText() {
            return this.getBundleText('LABEL_40036'); // 선택적근로제 상세내역
        },
  
        async onObjectMatched(oParameter) {
          const oViewModel = this.getViewModel();
  
          try {
            this.setContentsBusy(true);
  
            const { pernr: sPernr, zyymm: sZyymm } = oParameter;

            oViewModel.setProperty('/Datum', sZyymm)
  
            await this.readFlextimeSummary(sZyymm.substring(0,6));
            await this.readFlextimeDetails(sZyymm.substring(0,6));
            await this.initializeInputDialog();
  
            // this.setSummaryTableStyle();
            // this.setDetailsTableStyle();
            // this.initializeInputDialog();
          } catch (oError) {
            this.debug('Controller > flextime > onObjectMatched Error', oError);
  
            AppUtils.handleError(oError);
          } finally {
            AppUtils.setMenuBusy(false);
            AppUtils.setAppBusy(false);
            this.setContentsBusy(false);
          }
        },
  
        async readFlextimeSummary(sZyymm) {
          try {
            const oViewModel = this.getViewModel();
            const sYearMonth = _.isEmpty(sZyymm) ? moment().format('YYYYMM') : sZyymm;
  
            oViewModel.setProperty('/summary/Zyymm', sYearMonth);
  
            const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeSummary', {
              Actty: this.sAccty,
              Pernr: this.getAppointeeProperty('Pernr'),
              Zyymm: sYearMonth,
            });
            
            oViewModel.setProperty('/summary/rowCount', 1);
            oViewModel.setProperty('/summary/list', [
              _.chain(aResults)
                .map((o) => this.handshakeSummaryData(o))
                .get(0, { Zyymm: sYearMonth })
                .value(),
            ]);
  
            // 현재일 > 마감일자인 경우 또는 HR확정='X'인 경우 조회모드로 변경
            if((moment().format('YYYYMMDD') > moment(aResults[0].Clsda).format('YYYYMMDD')) || oViewModel.getProperty('/summary/list/0/Hrcfm') === 'X'){
              oViewModel.setProperty('/isMss', true);
            } else {
              oViewModel.setProperty('/isMss', this.isMss());
            }
  
            // HASS: HR확정='X'인 경우 확인/확인취소 버튼 보이지 않도록 변경
            if(oViewModel.getProperty('/isHass') && oViewModel.getProperty('/summary/list/0/Hrcfm') === 'X'){
               oViewModel.setProperty('/isHass', false);
            } else {
              oViewModel.setProperty('/isHass', this.isHass());
            }
  
          } catch (oError) {
            throw oError;
          }
        },
  
        async readFlextimeDetails(sZyymm) {
          try {
            const oViewModel = this.getViewModel();
            const sYearMonth = _.isEmpty(sZyymm) ? moment().format('YYYYMM') : sZyymm;
  
            const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeDetail', {
              Pernr: this.getAppointeeProperty('Pernr'),
              Zyymm: sYearMonth,
            });
  
            oViewModel.setProperty('/details/rowCount', aResults.length ?? 0);

            const aData = _.map(aResults, (o) => ({
              ..._.omit(o, '__metadata'),
              Datumtx: moment(o.Datum).format('YYYY.MM.DD'),
              FullDate: moment(o.Datum).format('YYYYMMDD'),
              Beguz: this.TimeUtils.nvl(o.Beguz),
              Enduz: this.TimeUtils.nvl(o.Enduz),
            }));

            oViewModel.setProperty(
              '/details/list',
              _.filter(aData, (e) => {
                return e.FullDate === oViewModel.getProperty('/Datum');
              })
            );

            console.log(oViewModel.getData())
          } catch (oError) {
            throw oError;
          } finally {
            // this.byId('flextimeDetailsTable').clearSelection(); 
          }
        },
  
        async initializeInputDialog() {
          const oView = this.getView();
  
          // if (this._oTimeInputDialog) return;
  
          // this._oTimeInputDialog = await Fragment.load({
          //   id: oView.getId(),
          //   name: 'sap.ui.yesco.mvc.view.flextime.fragment.TimeInputDialog',
          //   controller: this,
          // });
  
          // this._oTimeInputDialog
          //   .attachBeforeOpen(async () => {
              // this.setContentsBusy(true, 'Dialog');
  
              const oViewModel = this.getViewModel();
              // const aTargetDates = oViewModel.getProperty('/dialog/targetDates');
  
              // if (aTargetDates.length === 1) {
                // const dDate = moment(aTargetDates[0]).hours(9);
                const dDate = moment(oViewModel.getProperty('/details/list/0/Datum')).hours(9);
                const [mResult] = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeBreak', {
                  Pernr: this.getAppointeeProperty('Pernr'),
                  Zyymm: dDate.format('YYYYMM'),
                  Datum: dDate.toDate(),
                });
  
                _.chain(mResult)
                  .set('Pbeg0', this.TimeUtils.nvl(mResult.Pbeg0)) //
                  .set('Pend0', this.TimeUtils.nvl(mResult.Pend0))
                  .set('Pbeg1', this.TimeUtils.nvl(mResult.Pbeg1))
                  .set('Pend1', this.TimeUtils.nvl(mResult.Pend1))
                  .set('Pbeg2', this.TimeUtils.nvl(mResult.Pbeg2))
                  .set('Pend2', this.TimeUtils.nvl(mResult.Pend2))
                  .set('Pbeg3', this.TimeUtils.nvl(mResult.Pbeg3))
                  .set('Pend3', this.TimeUtils.nvl(mResult.Pend3))
                  .commit();
  
                oViewModel.setProperty('/dialog/work/list', [{}]);
                oViewModel.setProperty('/dialog/legal/list', [{ Beguz: _.get(mResult, 'Pbeg0'), Enduz: _.get(mResult, 'Pend0'), Anzb: _.get(mResult, 'Anzb0'), Brk01m: _.get(mResult, 'Brk01m') }]);
                oViewModel.setProperty('/dialog/extra/list', [
                  { Beguz: _.get(mResult, 'Pbeg1'), Enduz: _.get(mResult, 'Pend1'), Anzb: _.get(mResult, 'Anzb1'), Resn: _.get(mResult, 'Resn1'), Sumrow: false }, //
                  { Beguz: _.get(mResult, 'Pbeg2'), Enduz: _.get(mResult, 'Pend2'), Anzb: _.get(mResult, 'Anzb2'), Resn: _.get(mResult, 'Resn2'), Sumrow: false },
                  {
                    Beguz: null,
                    Enduz: null,
                    Anzb: _.chain(mResult)
                      .pick(['Anzb1', 'Anzb2', 'Anzb3'])
                      .values()
                      .sumBy((d) => _.toNumber(d))
                      .toString()
                      .value(),
                    Resn: '',
                    Sumrow: true,
                  },
                ]);
              // } else if (aTargetDates.length > 1) {
              //   oViewModel.setProperty('/dialog/work/list', [{ Beguz: this.TimeUtils.toEdm('0900'), Enduz: this.TimeUtils.toEdm('1800') }]);
              //   oViewModel.setProperty('/dialog/legal/list', [{ Beguz: this.TimeUtils.toEdm('1200'), Enduz: this.TimeUtils.toEdm('1300'), Anzb: '1.00', Brk01m: '1.00' }]);
              //   oViewModel.setProperty('/dialog/extra/list', [
              //     { Beguz: null, Enduz: null, Anzb: '', Resn: '', Sumrow: false }, //
              //     { Beguz: null, Enduz: null, Anzb: '', Resn: '', Sumrow: false },
              //     { Beguz: null, Enduz: null, Anzb: '0', Resn: '', Sumrow: true },
              //   ]);
              // }
          //   })
          //   .attachAfterOpen(() => this.setContentsBusy(false, 'Dialog'))
          //   .attachBeforeClose(() => {
          //     // this.resetTableTimePicker('flextimeWorkTable');
          //     // this.resetTableTimePicker('flextimeLegalTable');
          //     // this.resetTableTimePicker('flextimeExtraTable');
          //   });
  
          // oView.addDependent(this._oTimeInputDialog);
  
          // this.TableUtils.summaryColspan({ oTable: this.byId('flextimeExtraTable'), aHideIndex: [1] });
        },
  
        resetTableTimePicker(sTableId) {
          if (!sTableId) return;
  
          this.byId(sTableId)
            .getRows()
            .forEach((row) => {
              row.getCells().forEach((cell) => {
                if (cell instanceof sap.m.TimePicker) {
                  cell.setValue('0');
                } else if (cell instanceof sap.m.HBox) {
                  cell.getItems().forEach((item) => {
                    if (item instanceof sap.m.TimePicker) item.setValue('0');
                  });
                }
              });
            });
        },
  
        async onChangeWorktime(oEvent) {
          this.onChangeTimeFormat(oEvent);
  
          try {
            const mRowData = oEvent.getSource().getBindingContext().getObject();
  
            if (_.isEmpty(mRowData.Beguz) || _.isEmpty(mRowData.Enduz)) return;
  
            this.setContentsBusy(true, ['Input', 'Button']);
  
            // call deep
            await this.createProcess([mRowData.Datum]);
          } catch (oError) {
            this.debug('Controller > flextime > onChangeWorktime Error', oError);
  
            AppUtils.handleError(oError);
          }
        },
  
        onChangeTimeFormat(oEvent) {
          const oSource = oEvent.getSource();
          const aSourceValue = _.split(oSource.getValue(), ':');
  
          if (aSourceValue.length !== 2) return;
  
          const sConvertedMinutesValue = this.TimeUtils.stepMinutes(_.get(aSourceValue, 1));
  
          if (aSourceValue[1] === sConvertedMinutesValue) return;
  
          const aConvertTimes = [_.get(aSourceValue, 0), sConvertedMinutesValue];
  
          oSource.setValue(_.join(aConvertTimes, ':'));
          oSource.setDateValue(moment(_.join(aConvertTimes, ''), 'hhmm').toDate());
        },
  
        onDiffTime(oEvent) {
          this.onChangeTimeFormat(oEvent);
  
          const oRowBindingContext = oEvent.getSource().getBindingContext();
          const mRowData = oRowBindingContext.getObject();
          const sPath = oRowBindingContext.getPath();
          const sDiffTime = this.TimeUtils.diff(mRowData.Beguz, mRowData.Enduz);
  
          _.set(mRowData, 'Anzb', sDiffTime);
          if (_.isEmpty(sDiffTime)) _.set(mRowData, 'Resn', null);
  
          if (_.startsWith(sPath, '/dialog/extra')) this.calcExtraTimeSum();
        },
  
        calcExtraTimeSum() {
          const oViewModel = this.getViewModel();
          const aExtraList = oViewModel.getProperty('/dialog/extra/list');
  
          _.chain(aExtraList)
            .last() // 마지막 합계 행
            .set(
              'Anzb',
              _.chain(aExtraList)
                .dropRight() // 마지막 합계 행 제외
                .mapValues('Anzb')
                .values()
                .compact()
                .sumBy(_.toNumber)
                .toString()
                .value()
            )
            .commit();
  
          oViewModel.refresh();
        },
  
        setContentsBusy(bContentsBusy = true, vTarget = []) {
          const oViewModel = this.getViewModel();
          const mBusy = oViewModel.getProperty('/busy');
  
          if (_.isEmpty(vTarget)) {
            _.forOwn(mBusy, (v, p) => _.set(mBusy, p, bContentsBusy));
          } else {
            if (_.isArray(vTarget)) {
              _.forEach(vTarget, (s) => _.set(mBusy, s, bContentsBusy));
            } else {
              _.set(mBusy, vTarget, bContentsBusy);
            }
          }
  
          oViewModel.refresh();
        },
  
        helpInput(oEvent) {
          const oViewModel = this.getViewModel();
  
          oViewModel.setProperty('/dialog/targetDates', [oEvent.getSource().getBindingContext().getObject().Datum]);
  
          this._oTimeInputDialog.open();
        },
  
        onPressDialogConfirm() {
          try {
            this.setContentsBusy(true);
  
            this.validationBreak();
  
            MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
              // {저장}하시겠습니까?
              onClose: async (sAction) => {
                if (MessageBox.Action.CANCEL === sAction) {
                  this.setContentsBusy(true);
                  return;
                }
  
                // const aDatums = this.getViewModel().getProperty('/dialog/targetDates');
                const aDatums = [this.getViewModel().getProperty('/details/list/0/Datum')];
                const mBreak = this.getBreakInputData();
                const sDatum = this.getViewModel().getProperty('/Datum').substring(0,6);
  
                await this.createProcess(aDatums, mBreak); 
  
                await this.readFlextimeSummary(sDatum);
                await this.readFlextimeDetails(sDatum);
                await this.initializeInputDialog(); 
                // this._oTimeInputDialog.close();
              },
            });
          } catch (oError) {
            this.debug('Controller > flextime > onPressDialogConfirm Error', oError);
  
            this.setContentsBusy(false);
            AppUtils.handleError(oError);
          }
        },
  
        onTimeInputDialogClose(oEvent) {
          this.byId('flextimeDetailsTable').clearSelection();
          this.onDialogClose(oEvent);
        },
  
        getBreakInputData() {
          const oViewModel = this.getViewModel();
          const mDialog = oViewModel.getProperty('/dialog');
          const mLegalTime = _.get(mDialog, ['legal', 'list', 0]);
          const mExtraTime1 = _.get(mDialog, ['extra', 'list', 0]);
          const mExtraTime2 = _.get(mDialog, ['extra', 'list', 1]);
  
          const mBreakData = {
            Beguz: _.get(mDialog, ['work', 'list', 0, 'Beguz']),
            Enduz: _.get(mDialog, ['work', 'list', 0, 'Enduz']),
            Pbeg0: _.get(mLegalTime, 'Beguz'), // 법정휴게시작
            Pend0: _.get(mLegalTime, 'Enduz'), // 법정휴게종료
            Anzb0: _.get(mLegalTime, 'Anzb', '0'), // 법정휴게시간
            Pbeg1: _.get(mExtraTime1, 'Beguz'), // 추가휴게시작1
            Pend1: _.get(mExtraTime1, 'Enduz'), // 추가휴게종료1
            Anzb1: _.isEmpty(mExtraTime1.Beguz) || _.isEmpty(mExtraTime1.Enduz) ? '0' : _.get(mExtraTime1, 'Anzb'), // 추가휴게시간1
            Resn1: _.isEmpty(mExtraTime1.Beguz) || _.isEmpty(mExtraTime1.Enduz) ? '0' : _.get(mExtraTime1, 'Resn'), // 휴게사유 1
            Pbeg2: _.get(mExtraTime2, 'Beguz'), // 추가휴게시작2
            Pend2: _.get(mExtraTime2, 'Enduz'), // 추가휴게종료2
            Anzb2: _.isEmpty(mExtraTime2.Beguz) || _.isEmpty(mExtraTime2.Enduz) ? '0' : _.get(mExtraTime2, 'Anzb'), // 추가휴게시간2
            Resn2: _.isEmpty(mExtraTime2.Beguz) || _.isEmpty(mExtraTime2.Enduz) ? '0' : _.get(mExtraTime2, 'Resn'), // 휴게사유 2
          };
  
          return _.chain(mBreakData).omitBy(_.isEmpty).omitBy(_.isNil).omitBy(_.isNull).value();
        },
  
        validationBreak() {
          const oViewModel = this.getViewModel();
          const aExtraTimes = _.dropRight(oViewModel.getProperty('/dialog/extra/list'));
  
          if (_.some(aExtraTimes, (o) => !_.isEmpty(o.Beguz) && !_.isEmpty(o.Enduz) && _.isEmpty(o.Resn))) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_00003', 'LABEL_00154') }); // {사유}를 입력하세요.
          }
  
          const aTargetDates = oViewModel.getProperty('/dialog/targetDates');
  
          if (aTargetDates.length > 1) {
            const mWorkTime = oViewModel.getProperty('/dialog/work/list/0');
  
            if (_.isEmpty(mWorkTime.Beguz) || _.isEmpty(mWorkTime.Enduz)) {
              throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_00002', 'LABEL_40001') }); // {근무시간}을 입력하세요.
            }
          }
        },
  
        handshakeSummaryData(mSummaryData) {
          return {
            ..._.omit(mSummaryData, ['__metadata', 'AssoFlexTimeBreakSet', 'AssoFlexTimeDetailSet']),
            Beguz: this.TimeUtils.nvl(mSummaryData.Beguz),
            Enduz: this.TimeUtils.nvl(mSummaryData.Enduz),
            Gaptim: _.toNumber(mSummaryData.Gaptim),
            Gaptimtx: _.toNumber(mSummaryData.Gaptim) > 0 ? `+${_.toNumber(mSummaryData.Gaptim)}` : _.toNumber(mSummaryData.Gaptim).toString(),
            Clsdatx: moment(mSummaryData.Clsda).format('YYYY.MM.DD'),
          };
        },
  
        async createProcess(aDatums = [], mBreak = {}) {
          const oViewModel = this.getViewModel();
  
          if (_.isEmpty(aDatums)) {
            this.setContentsBusy(false, ['Input', 'Button']);
            return;
          }
  
          try {
            const mSummary = _.cloneDeep(oViewModel.getProperty('/summary/list/0'));
            const aDetails = _.chain(oViewModel.getProperty('/details/list'))
              .cloneDeep()
              .map((o) => this.TimeUtils.convert2400Time(o))
              .value();
  
            mBreak = this.TimeUtils.convert2400Time(mBreak);
  
            const mResults = await Client.deep(this.getModel(ServiceNames.WORKTIME), 'FlexTimeSummary', {
              ...mSummary,
              Accty: this.sAccty,
              Pernr: this.getAppointeeProperty('Pernr'),
              AssoFlexTimeDetailSet: _.map(aDatums, (d) => ({
                ..._.find(aDetails, { Datum: d }),
                ..._.pick(mBreak, ['Beguz', 'Enduz']),
              })),
              AssoFlexTimeBreakSet: _.isEmpty(mBreak)
                ? []
                : _.map(aDatums, (d) => {
                    const mDetailData = _.find(aDetails, { Datum: d });
  
                    return {
                      ..._.pick(mDetailData, ['Pernr', 'Zyymm', 'Datum', 'Beguz', 'Enduz']),
                      ...mBreak,
                    };
                  }),
            });
  
            oViewModel.setProperty('/summary/list', [this.handshakeSummaryData(mResults)]);
            oViewModel.setProperty(
              '/details/list',
              _.map(mResults.AssoFlexTimeDetailSet.results, (o) => ({
                ..._.omit(o, '__metadata'),
                Datumtx: moment(o.Datum).format('YYYY.MM.DD'),
                Beguz: this.TimeUtils.nvl(o.Beguz),
                Enduz: this.TimeUtils.nvl(o.Enduz),
              }))
            );
  
            // this.setDetailsTableStyle();
  
            if (!_.isEmpty(mResults.Errmsg)) {
              MessageBox.error(mResults.Errmsg, {
                onClose: () => this.setContentsBusy(false, ['Input', 'Button']),
              });
            } else {
              setTimeout(() => this.setContentsBusy(false, ['Input', 'Button']), 1000);
            }
          } catch (oError) {
            setTimeout(() => this.setContentsBusy(false, ['Input', 'Button']), 1000);
            throw oError;
          }
        },
  
      });
    }
  );
  