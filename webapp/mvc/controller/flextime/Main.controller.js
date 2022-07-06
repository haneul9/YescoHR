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

    return BaseController.extend('sap.ui.yesco.mvc.controller.flextime.Main', {
      sAccty: 'E',

      initializeModel() {
        return {
          initBeguz: moment('0900', 'hhmm').toDate(),
          initEnduz: moment('1800', 'hhmm').toDate(),
          isMss: false,
          isHass: false,
          busy: {
            Button: false,
            Dialog: false,
            Input: false,
            Summary: false,
            Details: false,
          },
          summary: {
            rowCount: 1,
            Zyymm: '',
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

      async callbackAppointeeChange() {
        try {
          this.setContentsBusy(true, ['Summary', 'Details', 'Button']);
          this.resetTableTimePicker('flextimeDetailsTable');

          const sZyymm = this.getViewModel().getProperty('/summary/list/0/Zyymm');

          await this.readFlextimeSummary(sZyymm);
          await this.readFlextimeDetails(sZyymm);

          this.setDetailsTableStyle();
        } catch (oError) {
          this.debug('Controller > flextime > callbackAppointeeChange Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Summary', 'Details', 'Button']);
        }
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        try {
          this.setContentsBusy(true);
          this.getAppointeeModel().setProperty('/showBarChangeButton', this.isHass());
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/isMss', this.isMss());
          oViewModel.setProperty('/isHass', this.isHass());

          const { pernr: sPernr, zyymm: sZyymm } = oParameter;

          await this.setAppointee(sPernr);

          await this.readFlextimeSummary(sZyymm);
          await this.readFlextimeDetails(sZyymm);

          this.setSummaryTableStyle();
          this.setDetailsTableStyle();
          this.initializeInputDialog();
        } catch (oError) {
          this.debug('Controller > flextime > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setMenuBusy(false);
          AppUtils.setAppBusy(false);
          this.setContentsBusy(false);
        }
      },

      async setAppointee(sPernr) {
        try {
          const mSessionData = this.getSessionData();

          // if (!sPernr || _.isEqual(_.toNumber(sPernr), _.toNumber(mSessionData.Pernr))) return;
          if (!sPernr) return;

          const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Ename: sPernr,
          });

          _.chain(mAppointee)
            .set('Orgtx', mAppointee.Fulln) //
            .set('Photo', mAppointee.Photo || this.getUnknownAvatarImageURL())
            .commit();

          AppUtils.getAppComponent().getAppointeeModel().setData(mAppointee, true);
        } catch (oError) {
          throw oError;
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
          if (moment().format('YYYYMMDD') > moment(aResults[0].Clsda).format('YYYYMMDD') || oViewModel.getProperty('/summary/list/0/Hrcfm') === 'X') {
            oViewModel.setProperty('/isMss', true);
          } else {
            oViewModel.setProperty('/isMss', this.isMss());
          }

          // HASS: HR확정='X'인 경우 확인/확인취소 버튼 보이지 않도록 변경
          if (oViewModel.getProperty('/isHass') && oViewModel.getProperty('/summary/list/0/Hrcfm') === 'X') {
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
          oViewModel.setProperty(
            '/details/list',
            _.map(aResults, (o) => ({
              ..._.omit(o, '__metadata'),
              Datumtx: moment(o.Datum).format('YYYY.MM.DD'),
              Beguz: this.TimeUtils.nvl(o.Beguz),
              Enduz: this.TimeUtils.nvl(o.Enduz),
            }))
          );
        } catch (oError) {
          throw oError;
        } finally {
          this.byId('flextimeDetailsTable').clearSelection();
        }
      },

      setSummaryTableStyle() {
        const oSummaryTable = this.byId('flextimeSummaryTable');

        setTimeout(() => {
          this.TableUtils.setColorColumn({ oTable: oSummaryTable, mColorMap: { 3: 'bgType10', 4: 'bgType10', 5: 'bgType11', 6: 'bgType11', 7: 'bgType12' } });
        }, 100);
      },

      setDetailsTableStyle() {
        setTimeout(() => {
          const oDetailsTable = this.byId('flextimeDetailsTable');
          const sTableId = oDetailsTable.getId();

          oDetailsTable.getRows().forEach((row, i) => {
            const mRowData = row.getBindingContext().getObject();

            if (mRowData.Erryn === 'X' && mRowData.Hrcfm === '') {
              row.addStyleClass('row-error');
            } else {
              row.removeStyleClass('row-error');
            }

            if (mRowData.Checked) {
              row.addStyleClass('row-select');
            } else {
              row.removeStyleClass('row-select');
            }

            if (mRowData.Offyn === 'X' || mRowData.Alldf === true) {
              $(`#${sTableId}-rowsel${i}`).addClass('disabled-table-selection');
            } else {
              $(`#${sTableId}-rowsel${i}`).removeClass('disabled-table-selection');
            }
          });
        }, 100);
      },

      onSelectionDetailsTable(oEvent) {
        const oViewModel = this.getViewModel();
        const oTable = oEvent.getSource();
        const aDetailsList = oViewModel.getProperty('/details/list');

        if (oEvent.getParameter('selectAll') === true) {
          _.forEach(aDetailsList, (o, i) => {
            if (o.Offyn === 'X' || o.Alldf === true) oTable.removeSelectionInterval(i, i);
          });

          // $(`#${oTable.getId()}-selall`).removeClass('sapUiTableSelAll').attr('aria-checked', true);
        }

        const aSelectedIndices = oTable.getSelectedIndices();

        _.forEach(aDetailsList, (o, i) => _.set(o, 'Checked', _.includes(aSelectedIndices, i)));
        oViewModel.refresh();

        this.setDetailsTableStyle();
      },

      async initializeInputDialog() {
        const oView = this.getView();

        if (this._oTimeInputDialog) return;

        this._oTimeInputDialog = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.flextime.fragment.TimeInputDialog',
          controller: this,
        });

        this._oTimeInputDialog
          .attachBeforeOpen(async () => {
            this.setContentsBusy(true, 'Dialog');

            const oViewModel = this.getViewModel();
            const aTargetDates = oViewModel.getProperty('/dialog/targetDates');

            if (aTargetDates.length === 1) {
              const dDate = moment(aTargetDates[0]).hours(9);
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
            } else if (aTargetDates.length > 1) {
              oViewModel.setProperty('/dialog/work/list', [{ Beguz: this.TimeUtils.toEdm('0900'), Enduz: this.TimeUtils.toEdm('1800') }]);
              oViewModel.setProperty('/dialog/legal/list', [{ Beguz: this.TimeUtils.toEdm('1200'), Enduz: this.TimeUtils.toEdm('1300'), Anzb: '1.00', Brk01m: '1.00' }]);
              oViewModel.setProperty('/dialog/extra/list', [
                { Beguz: null, Enduz: null, Anzb: '', Resn: '', Sumrow: false }, //
                { Beguz: null, Enduz: null, Anzb: '', Resn: '', Sumrow: false },
                { Beguz: null, Enduz: null, Anzb: '0', Resn: '', Sumrow: true },
              ]);
            }
          })
          .attachAfterOpen(() => this.setContentsBusy(false, 'Dialog'))
          .attachBeforeClose(() => {
            this.resetTableTimePicker('flextimeWorkTable');
            this.resetTableTimePicker('flextimeLegalTable');
            this.resetTableTimePicker('flextimeExtraTable');
          });

        oView.addDependent(this._oTimeInputDialog);

        this.TableUtils.summaryColspan({ oTable: this.byId('flextimeExtraTable'), aHideIndex: [1] });
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

      async onChangeMonth(oEvent) {
        try {
          this.setContentsBusy(true, ['Summary', 'Details', 'Button']);

          this.resetTableTimePicker('flextimeDetailsTable');

          const oViewModel = this.getViewModel();
          const sZyymm = oEvent.getParameter('value');

          // 2022년 6월 이전 조회 불가능
          if (sZyymm < '202206') {
            MessageBox.alert(this.getBundleText('MSG_40004')); // 2022.06 이후부터 선택이 가능합니다.
            oViewModel.setProperty('/summary/list/0/Zyymm', oViewModel.getProperty('/summary/Zyymm'));
            this.setContentsBusy(false, ['Summary', 'Details', 'Button']);
            return;
          }

          // 현재일 기준 익월까지만 선택 가능
          // const sNextZyymm = moment().add('1', 'months').toDate();
          // const sNextMonth = moment(sNextZyymm).format('YYYYMM');
          // if(sZyymm > sNextMonth){
          //     MessageBox.alert(this.getBundleText('MSG_40005')); // 현재일 기준 익월까지만 선택이 가능합니다.
          //     oViewModel.setProperty('/summary/list/0/Zyymm', oViewModel.getProperty('/summary/Zyymm'));
          //     this.setContentsBusy(false, ['Summary', 'Details', 'Button']);
          //     return;
          // }

          await this.readFlextimeSummary(sZyymm);
          await this.readFlextimeDetails(sZyymm);

          this.setDetailsTableStyle();
        } catch (oError) {
          this.debug('Controller > flextime > onChangeMonth Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Summary', 'Details', 'Button']);
        }
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

      onPressBatchButton() {
        const oViewModel = this.getViewModel();
        const aDetailsList = oViewModel.getProperty('/details/list');
        const aSelectedIndices = this.byId('flextimeDetailsTable').getSelectedIndices();

        if (aSelectedIndices.length < 2) {
          MessageBox.alert(this.getBundleText('MSG_40002')); // 일괄입력할 일자를 두 건 이상 선택하여 주십시오.
          return;
        }

        oViewModel.setProperty(
          '/dialog/targetDates',
          _.map(aSelectedIndices, (d) => _.get(aDetailsList, [d, 'Datum']))
        );

        this._oTimeInputDialog.open();
      },

      onPressDialogConfirm() {
        try {
          this.setContentsBusy(true, ['Input', 'Button']);

          this.validationBreak();

          MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
            // {저장}하시겠습니까?
            onClose: async (sAction) => {
              if (MessageBox.Action.CANCEL === sAction) {
                this.setContentsBusy(false, ['Input', 'Button']);
                return;
              }

              const aDatums = this.getViewModel().getProperty('/dialog/targetDates');
              const mBreak = this.getBreakInputData();

              await this.createProcess(aDatums, mBreak);

              this.byId('flextimeDetailsTable').clearSelection();
              this._oTimeInputDialog.close();
            },
          });
        } catch (oError) {
          this.debug('Controller > flextime > onPressDialogConfirm Error', oError);

          this.setContentsBusy(false, ['Input', 'Button']);
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

          this.setDetailsTableStyle();

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

      // onHRConfirm(){
      //   try {
      //     this.setContentsBusy(true, ['Input', 'Button']);

      //     const oViewModel = this.getViewModel();
      //     const aDetailsList = oViewModel.getProperty('/details/list');
      //     const aSelectedIndices = this.byId('flextimeDetailsTable').getSelectedIndices();

      //     if (aSelectedIndices.length == 0 ) {
      //         MessageBox.alert(this.getBundleText('MSG_40006', 'LABEL_40032')); // 확인할 데이터를 선택하여 주십시오.
      //         this.setContentsBusy(false, ['Input', 'Button']);
      //         return;
      //     }

      //     MessageBox.confirm(this.getBundleText('LABEL_40032', 'LABEL_00103'), {
      //       // {확인}하시겠습니까?
      //       onClose: async (sAction) => {
      //         if (MessageBox.Action.CANCEL === sAction) {
      //           this.setContentsBusy(false, ['Input', 'Button']);
      //           return;
      //         }

      //         const aDatums = this.getViewModel().getProperty('/dialog/targetDates');
      //         const mBreak = this.getBreakInputData();

      //         await this.createProcess(aDatums, mBreak);

      //         this.byId('flextimeDetailsTable').clearSelection();
      //         this._oTimeInputDialog.close();
      //       },
      //     });
      //   } catch (oError) {
      //     this.debug('Controller > flextime > onHRConfirm Error', oError);

      //     this.setContentsBusy(false, ['Input', 'Button']);
      //     AppUtils.handleError(oError);
      //   }
      // },

      onHRConfirm() {
        try {
          const oViewModel = this.getViewModel();
          const aDetailsList = oViewModel.getProperty('/details/list');
          const aSelectedIndices = this.byId('flextimeDetailsTable').getSelectedIndices();

          if (aSelectedIndices.length == 0) {
            MessageBox.alert(this.getBundleText('MSG_40006', 'LABEL_40032')); // {확인}할 데이터를 선택하여 주십시오.
            return;
          }

          const aSelectData = _.map(aSelectedIndices, (d) => _.get(aDetailsList, [d]));
          const sFlag = _.find(aSelectData, (e) => {
            return e.Erryn !== 'X';
          })
            ? 'X'
            : '';

          if (sFlag == 'X') {
            MessageBox.alert(this.getBundleText('MSG_40010')); // 선택한 데이터 중 에러가 아닌 데이터가 존재합니다.
            return;
          }

          MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_40029'), {
            // {HR확인} 하시겠습니까?
            onClose: async (sAction) => {
              if (MessageBox.Action.CANCEL === sAction) {
                this.setContentsBusy(false, ['Input', 'Button']);
                return;
              }
              this.setContentsBusy(true, ['Input', 'Button']);

              await this.createHRProcess(aSelectData, 'C');

              this.byId('flextimeDetailsTable').clearSelection();
            },
          });
        } catch (oError) {
          this.debug('Controller > flextime > List > onHRConfirm Error', oError);

          this.setContentsBusy(false, ['Input', 'Button']);
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Input', 'Button']);
        }
      },

      onHRCancel() {
        try {
          const oViewModel = this.getViewModel();
          const aDetailsList = oViewModel.getProperty('/details/list');
          const aSelectedIndices = this.byId('flextimeDetailsTable').getSelectedIndices();

          if (aSelectedIndices.length == 0) {
            MessageBox.alert(this.getBundleText('MSG_40006', 'LABEL_40033')); // {확인취소}할 데이터를 선택하여 주십시오.
            return;
          }

          const aSelectData = _.map(aSelectedIndices, (d) => _.get(aDetailsList, [d]));
          const sFlag = _.find(aSelectData, (e) => {
            return e.Hrcfm !== 'X';
          })
            ? 'X'
            : '';

          if (sFlag == 'X') {
            MessageBox.alert(this.getBundleText('MSG_40011')); // 선택한 데이터 중 확인 상태가 아닌 데이터가 존재합니다.
            return;
          }

          MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_40033'), {
            // {확인취소}하시겠습니까?
            onClose: async (sAction) => {
              if (MessageBox.Action.CANCEL === sAction) {
                this.setContentsBusy(false, ['Input', 'Button']);
                return;
              }
              this.setContentsBusy(true, ['Input', 'Button']);

              await this.createHRProcess(aSelectData, 'D');

              this.byId('flextimeDetailsTable').clearSelection();
            },
          });
        } catch (oError) {
          this.debug('Controller > flextime > List > onHRConfirm Error', oError);

          this.setContentsBusy(false, ['Input', 'Button']);
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Input', 'Button']);
        }
      },

      // C 확인, D 확인취소
      async createHRProcess(aData, sPrcty) {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        try {
          await Promise.all(_.map(aData, async (o) => Client.create(oModel, 'FlexTimeDetail', { ...o, Prcty: sPrcty })));

          MessageBox.alert(this.getBundleText('MSG_40008', sPrcty == 'C' ? 'LABEL_40032' : 'LABEL_40033')); // {확인|확인취소} 처리가 완료되었습니다.
          this.callbackAppointeeChange();
          this.setContentsBusy(false, ['Input', 'Button']);
        } catch (oError) {
          setTimeout(() => this.setContentsBusy(false, ['Input', 'Button']), 1000);
          this.debug('Controller > flextime > List > onHRConfirm Error', oError);

          this.setContentsBusy(false, ['Input', 'Button']);
          AppUtils.handleError(oError);

          throw oError;
        }
      },
    });
  }
);
