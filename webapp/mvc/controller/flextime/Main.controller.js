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
          busy: {
            Button: false,
            Dialog: false,
            Input: false,
            Summary: false,
            Details: false,
          },
          summary: {
            rowCount: 1,
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
              rowCount: 4,
              list: [
                { Beguz: null, Enduz: null, Sumrow: false },
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

          const sZyymm = this.getViewModel().getProperty('/summary/list/0/Zyymm');

          await this.readFlextimeSummary(sZyymm);
          await this.readFlextimeDetails(sZyymm);

          this.setDetailsTableRowColor();
        } catch (oError) {
          this.debug('Controller > flextime > callbackAppointeeChange Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Summary', 'Details', 'Button']);
        }
      },

      async onObjectMatched() {
        try {
          this.getViewModel().setData(this.initializeModel());
          this.setContentsBusy(true);

          this.getAppointeeModel().setProperty('/showBarChangeButton', this.isHass());

          await this.readFlextimeSummary();
          await this.readFlextimeDetails();

          this.setTableColor();
          this.setDetailsTableRowColor();
          this.initializeInputDialog();
        } catch (oError) {
          this.debug('Controller > flextime > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async readFlextimeSummary(sZyymm) {
        try {
          const sYearMonth = _.isEmpty(sZyymm) ? moment().format('YYYYMM') : sZyymm;
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeSummary', {
            Actty: this.sAccty,
            Pernr: this.getAppointeeProperty('Pernr'),
            Zyymm: sYearMonth,
          });

          this.getViewModel().setProperty('/summary/rowCount', 1);
          this.getViewModel().setProperty('/summary/list', [
            _.chain(aResults)
              .map((o) => ({
                ..._.omit(o, '__metadata'),
                Clsdatx: moment(o.Clsda).format('YYYY.MM.DD'),
                Beguz: this.TimeUtils.nvl(o.Beguz),
                Enduz: this.TimeUtils.nvl(o.Enduz),
              }))
              .get(0, { Zyymm: sYearMonth })
              .value(),
          ]);
        } catch (oError) {
          throw oError;
        }
      },

      async readFlextimeDetails(sZyymm) {
        try {
          const sYearMonth = _.isEmpty(sZyymm) ? moment().format('YYYYMM') : sZyymm;
          const mPayload = {
            Werks: this.getAppointeeProperty('Werks'),
            Pernr: this.getAppointeeProperty('Pernr'),
            Zyymm: sYearMonth,
          };
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeDetail', { ..._.omit(mPayload, 'Werks') });

          this.getViewModel().setProperty('/details/rowCount', aResults.length ?? 0);
          this.getViewModel().setProperty(
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

      setTableColor() {
        const oSummaryTable = this.byId('flextimeSummaryTable');

        setTimeout(() => {
          this.TableUtils.setColorColumn({ oTable: oSummaryTable, mColorMap: { 3: 'bgType10', 4: 'bgType10', 5: 'bgType11', 6: 'bgType11', 7: 'bgType12' } });
        }, 100);
      },

      setDetailsTableRowColor() {
        setTimeout(() => {
          const oDetailsTable = this.byId('flextimeDetailsTable');
          const sTableId = oDetailsTable.getId();

          oDetailsTable.getRows().forEach((row, i) => {
            const mRowData = row.getBindingContext().getObject();

            if (mRowData.Erryn === 'X') {
              row.addStyleClass('row-error');
            } else {
              row.removeStyleClass('row-error');
            }

            if (mRowData.Checked) {
              row.addStyleClass('row-select');
            } else {
              row.removeStyleClass('row-select');
            }

            if (mRowData.Offyn === 'X') {
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
            if (o.Offyn === 'X') oTable.removeSelectionInterval(i, i);
          });

          // $(`#${oTable.getId()}-selall`).removeClass('sapUiTableSelAll').attr('aria-checked', true);
        }

        const aSelectedIndices = oTable.getSelectedIndices();

        _.forEach(aDetailsList, (o, i) => _.set(o, 'Checked', _.includes(aSelectedIndices, i)));
        oViewModel.refresh();

        this.setDetailsTableRowColor();
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
                { Beguz: _.get(mResult, 'Pbeg3'), Enduz: _.get(mResult, 'Pend3'), Anzb: _.get(mResult, 'Anzb3'), Resn: _.get(mResult, 'Resn3'), Sumrow: false },
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
                { Beguz: null, Enduz: null, Anzb: '', Resn: '', Sumrow: false },
                { Beguz: null, Enduz: null, Anzb: '0', Resn: '', Sumrow: true },
              ]);
            }
          })
          .attachAfterOpen(() => this.setContentsBusy(false, 'Dialog'));

        oView.addDependent(this._oTimeInputDialog);

        this.TableUtils.summaryColspan({ oTable: this.byId('flextimeExtraTable'), aHideIndex: [1] });
      },

      async onChangeMonth(oEvent) {
        try {
          this.setContentsBusy(true, ['Summary', 'Details', 'Button']);

          const sZyymm = oEvent.getParameter('value');

          await this.readFlextimeSummary(sZyymm);
          await this.readFlextimeDetails(sZyymm);

          this.setDetailsTableRowColor();
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

        // oSource.setValue(_.join(aConvertTimes, ':'));
        oSource.setDateValue(moment(_.join(aConvertTimes, ''), 'hhmm').toDate());
      },

      onDiffTime(oEvent) {
        this.onChangeTimeFormat(oEvent);

        const oRowBindingContext = oEvent.getSource().getBindingContext();
        const mRowData = oRowBindingContext.getObject();
        const sPath = oRowBindingContext.getPath();

        _.set(mRowData, 'Anzb', this.TimeUtils.diff(mRowData.Beguz, mRowData.Enduz));

        if (_.startsWith(sPath, '/dialog/extra')) this.calcExtraTimeSum();
      },

      calcExtraTimeSum() {
        const oViewModel = this.getViewModel();
        const aExtraList = oViewModel.getProperty('/dialog/extra/list');

        oViewModel.setProperty('/dialog/extra/list/3/Anzb', _.chain(aExtraList).take(3).mapValues('Anzb').values().compact().sumBy(_.toNumber).toString().value());
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

        const mBreakData = {
          Beguz: _.get(mDialog, ['work', 'list', 0, 'Beguz']),
          Enduz: _.get(mDialog, ['work', 'list', 0, 'Enduz']),
          Pbeg0: _.get(mDialog, ['legal', 'list', 0, 'Beguz']), // 법정휴게시작
          Pend0: _.get(mDialog, ['legal', 'list', 0, 'Enduz']), // 법정휴게종료
          Anzb0: _.get(mDialog, ['legal', 'list', 0, 'Anzb']), // 법정휴게시간
          Pbeg1: _.get(mDialog, ['extra', 'list', 0, 'Beguz']), // 추가휴게시작1
          Pend1: _.get(mDialog, ['extra', 'list', 0, 'Enduz']), // 추가휴게종료1
          Anzb1: _.get(mDialog, ['extra', 'list', 0, 'Anzb']), // 추가휴게시간1
          Pbeg2: _.get(mDialog, ['extra', 'list', 1, 'Beguz']), // 추가휴게시작2
          Pend2: _.get(mDialog, ['extra', 'list', 1, 'Enduz']), // 추가휴게종료2
          Anzb2: _.get(mDialog, ['extra', 'list', 1, 'Anzb']), // 추가휴게시간2
          Pbeg3: _.get(mDialog, ['extra', 'list', 2, 'Beguz']), // 추가휴게시작3
          Pend3: _.get(mDialog, ['extra', 'list', 2, 'Enduz']), // 추가휴게종료3
          Anzb3: _.get(mDialog, ['extra', 'list', 2, 'Anzb']), // 추가휴게시간3
          Resn1: _.get(mDialog, ['extra', 'list', 0, 'Resn']), // 휴게사유 1
          Resn2: _.get(mDialog, ['extra', 'list', 1, 'Resn']), // 휴게사유 2
          Resn3: _.get(mDialog, ['extra', 'list', 2, 'Resn']), // 휴게사유 3
        };

        return _.chain(mBreakData).omitBy(_.isEmpty).omitBy(_.isNil).omitBy(_.isNull).value();
      },

      validationBreak() {
        const oViewModel = this.getViewModel();
        const aExtraTimes = _.take(oViewModel.getProperty('/dialog/extra/list'), 3);

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

          oViewModel.setProperty('/summary/list', [
            {
              ..._.omit(mResults, ['__metadata', 'AssoFlexTimeBreakSet', 'AssoFlexTimeDetailSet']),
              Clsdatx: moment(mResults.Clsda).format('YYYY.MM.DD'),
              Beguz: this.TimeUtils.nvl(mResults.Beguz),
              Enduz: this.TimeUtils.nvl(mResults.Enduz),
            },
          ]);
          oViewModel.setProperty(
            '/details/list',
            _.map(mResults.AssoFlexTimeDetailSet.results, (o) => ({
              ..._.omit(o, '__metadata'),
              Datumtx: moment(o.Datum).format('YYYY.MM.DD'),
              Beguz: this.TimeUtils.nvl(o.Beguz),
              Enduz: this.TimeUtils.nvl(o.Enduz),
            }))
          );

          this.setDetailsTableRowColor();

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
