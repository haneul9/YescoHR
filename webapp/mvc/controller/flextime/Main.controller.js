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
            breakTime: [],
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

          aResults.push({ Zyymm: sYearMonth, Caldays: '31', Wrkdays: '22', Bastim: '177', Ctrtim: '196', Daytim: '194', Gaptim: '-2', Wekavg: '48.50', Statxt: '계약근로시간 미달', Stacol: '2', Clsda: moment('20220405').toDate(), Clsdatx: moment('20220405').format('YYYY.MM.DD') });

          this.getViewModel().setProperty('/summary/rowCount', 1);
          this.getViewModel().setProperty('/summary/list', [
            _.chain(aResults)
              .map((o) => _.set(o, 'Clsdatx', moment(o.Clsda).format('YYYY.MM.DD')))
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

          aResults.push({ Offyn: 'X', Datum: moment(`${sYearMonth}01`).toDate(), Datumtx: moment(`${sYearMonth}01`).format('YYYY.MM.DD'), Daytx: '화', Atext: '', Beguz: null, Enduz: null, Brk01: '', Brk02: '', Reltim: '', Paytim: '8.00', Stdazc: '8.00', Brk01m: '1.00', Notes: '', Erryn: '' });
          aResults.push({ Offyn: '', Datum: moment(`${sYearMonth}02`).toDate(), Datumtx: moment(`${sYearMonth}02`).format('YYYY.MM.DD'), Daytx: '수', Atext: '', Beguz: moment('0900', 'hhmm').toDate(), Enduz: moment('1800', 'hhmm').toDate(), Brk01: '1.00', Brk02: '0.00', Reltim: '8.00', Paytim: '', Stdazc: '16.00', Brk01m: '1.00', Notes: '', Erryn: '' });
          aResults.push({ Offyn: 'X', Datum: moment(`${sYearMonth}03`).toDate(), Datumtx: moment(`${sYearMonth}03`).format('YYYY.MM.DD'), Daytx: '목', Atext: '연차', Beguz: null, Enduz: null, Brk01: '', Brk02: '', Reltim: '', Paytim: '8.00', Stdazc: '24.00', Brk01m: '', Notes: '', Erryn: '' });
          aResults.push({ Offyn: '', Datum: moment(`${sYearMonth}04`).toDate(), Datumtx: moment(`${sYearMonth}04`).format('YYYY.MM.DD'), Daytx: '금', Atext: '', Beguz: moment('1000', 'hhmm').toDate(), Enduz: moment('1500', 'hhmm').toDate(), Brk01: '1.00', Brk02: '0.00', Reltim: '4.50', Paytim: '', Stdazc: '28.50', Brk01m: '0.50', Notes: '', Erryn: '' });
          aResults.push({ Offyn: 'X', Datum: moment(`${sYearMonth}05`).toDate(), Datumtx: moment(`${sYearMonth}05`).format('YYYY.MM.DD'), Daytx: '토', Atext: '', Beguz: null, Enduz: null, Brk01: '', Brk02: '', Reltim: '', Paytim: '', Stdazc: '28.50', Brk01m: '', Notes: '', Erryn: '' });
          aResults.push({ Offyn: 'X', Datum: moment(`${sYearMonth}06`).toDate(), Datumtx: moment(`${sYearMonth}06`).format('YYYY.MM.DD'), Daytx: '일', Atext: '', Beguz: null, Enduz: null, Brk01: '', Brk02: '', Reltim: '', Paytim: '', Stdazc: '28.50', Brk01m: '', Notes: '', Erryn: '' });
          aResults.push({ Offyn: '', Datum: moment(`${sYearMonth}07`).toDate(), Datumtx: moment(`${sYearMonth}07`).format('YYYY.MM.DD'), Daytx: '월', Atext: '', Beguz: moment('0900', 'hhmm').toDate(), Enduz: moment('2130', 'hhmm').toDate(), Brk01: '0.50', Brk02: '0.00', Reltim: '12.00', Paytim: '', Stdazc: '40.00', Brk01m: '1.00', Notes: '필수휴게시간 미달', Erryn: 'X' });
          aResults.push({ Offyn: '', Datum: moment(`${sYearMonth}08`).toDate(), Datumtx: moment(`${sYearMonth}08`).format('YYYY.MM.DD'), Daytx: '화', Atext: '반차(오전)', Beguz: moment('1400', 'hhmm').toDate(), Enduz: moment('1800', 'hhmm').toDate(), Brk01: '0.00', Brk02: '0.00', Reltim: '4.00', Paytim: '4.00', Stdazc: '48.00', Brk01m: '0.00', Notes: '시작시간 13시부터 가능', Erryn: '' });
          aResults.push({ Offyn: '', Datum: moment(`${sYearMonth}09`).toDate(), Datumtx: moment(`${sYearMonth}09`).format('YYYY.MM.DD'), Daytx: '수', Atext: '반차(오후)', Beguz: moment('0900', 'hhmm').toDate(), Enduz: moment('1300', 'hhmm').toDate(), Brk01: '0.00', Brk02: '0.00', Reltim: '4.00', Paytim: '4.00', Stdazc: '52.00', Brk01m: '0.00', Notes: '종료시간 14시까지 가능', Erryn: '' });

          this.getViewModel().setProperty('/details/rowCount', aResults.length ?? 0);
          this.getViewModel().setProperty('/details/list', aResults ?? []);
          this.getViewModel().setProperty(
            '/details/breakTime',
            _.map(aResults, (o) => ({
              ...mPayload,
              Datum: o.Datum,
              Datumtx: moment(o.Datum).format('YYYY.MM.DD'),
              Beguz: '',
              Enduz: '',
              Pbeg0: '',
              Pend0: '',
              Pbeg1: '',
              Pend1: '',
              Pbeg2: '',
              Pend2: '',
              Pbeg3: '',
              Pend3: '',
              Anzb0: '',
              Anzb1: '',
              Anzb2: '',
              Anzb3: '',
              Resn1: '',
              Resn2: '',
              Resn3: '',
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

        this._oTimeInputDialog.attachBeforeOpen(async () => {
          const oViewModel = this.getViewModel();
          const aTargetDates = oViewModel.getProperty('/dialog/targetDates');

          if (aTargetDates.length === 1) {
            const dDate = moment(aTargetDates[0]).hours(9);
            const [mResult] = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeBreak', {
              Pernr: this.getAppointeeProperty('Pernr'),
              Zyymm: dDate.format('YYYYMM'),
              Datum: dDate.toDate(),
            });

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
                  .pick(['Pend1', 'Pend2', 'Pend3'])
                  .values()
                  .sumBy((d) => _.toNumber(d))
                  .toString()
                  .value(),
                Resn: '',
                Sumrow: true,
              },
            ]);
          } else if (aTargetDates.length > 1) {
            oViewModel.setProperty('/dialog/work/list', [{ Beguz: moment('0900', 'hhmm').toDate(), Enduz: moment('1800', 'hhmm').toDate() }]);
            oViewModel.setProperty('/dialog/legal/list', [{ Beguz: moment('1200', 'hhmm').toDate(), Enduz: moment('1300', 'hhmm').toDate(), Anzb: '1.00', Brk01m: '1.00' }]);
            oViewModel.setProperty('/dialog/extra/list', [
              { Beguz: null, Enduz: null, Anzb: '', Resn: '', Sumrow: false }, //
              { Beguz: null, Enduz: null, Anzb: '', Resn: '', Sumrow: false },
              { Beguz: null, Enduz: null, Anzb: '', Resn: '', Sumrow: false },
              { Beguz: null, Enduz: null, Anzb: '0', Resn: '', Sumrow: true },
            ]);
          }
        });

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

      onChangeTimeFormat(oEvent) {
        const oSource = oEvent.getSource();
        const aSourceValue = _.split(oSource.getValue(), ':');
        const iMinutesRemainder = _.chain(aSourceValue).get(1).toNumber().divide(30).value();

        if (!_.isInteger(iMinutesRemainder)) {
          const iConvertedMinutesValue = _.chain(iMinutesRemainder).floor().multiply(30).value();

          oSource.setValue([_.get(aSourceValue, 0), iConvertedMinutesValue].join(':'));
          oSource.setDateValue(moment(`${_.get(aSourceValue, 0)}${iConvertedMinutesValue}`, 'hhmm').toDate());
        } else {
          oSource.setDateValue(moment(aSourceValue.join(''), 'hhmm').toDate());
        }
      },

      onDiffTime(oEvent) {
        this.onChangeTimeFormat(oEvent);

        const oRowBindingContext = oEvent.getSource().getBindingContext();
        const mRowData = oRowBindingContext.getObject();
        const sPath = oRowBindingContext.getPath();
        const sTimeFormat = 'hhmm';

        if (_.isDate(mRowData.Beguz) && _.isDate(mRowData.Enduz)) {
          _.set(
            mRowData,
            'Anzb',
            _.toString(
              moment
                .duration(moment(mRowData.Enduz, sTimeFormat).diff(moment(mRowData.Beguz, sTimeFormat)))
                .abs()
                .asHours()
            )
          );
        } else {
          _.set(mRowData, 'Anzb', '');
        }

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

          const oViewModel = this.getViewModel();
          const aExtraTimes = _.take(oViewModel.getProperty('/dialog/extra/list'), 3);

          if (_.some(aExtraTimes, (o) => !_.isEmpty(o.Anzb) && _.isEmpty(o.Resn))) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_00003', 'LABEL_00154') }); // {사유}를 입력하세요.
          }

          const aTargetDates = oViewModel.getProperty('/dialog/targetDates');

          if (aTargetDates.length > 1) {
            const mWorkTime = oViewModel.getProperty('/dialog/work/list/0');

            if (!_.isDate(mWorkTime.Beguz) || !_.isDate(mWorkTime.Enduz)) {
              throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_00002', 'LABEL_40001') }); // {근무시간}을 입력하세요.
            }
          }

          MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
            // {저장}하시겠습니까?
            onClose: (sAction) => {
              if (MessageBox.Action.CANCEL !== sAction) {
                // this.createProcess('T');
              }

              this.setContentsBusy(false, ['Input', 'Button']);
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

      async createProcess(dDatum) {
        const oViewModel = this.getViewModel();

        try {
          const mSummary = _.cloneDeep(oViewModel.getProperty('/summary/list/0'));
          const aDetails = _.cloneDeep(oViewModel.getProperty('/details/list'));
          const aBreakTimes = _.cloneDeep(oViewModel.getProperty('/details/breakTime'));

          if (!_.isEmpty(value)) {
            aDetails = _.filter(aDetails, { Datum: dDatum });
            aBreakTimes = _.filter(aBreakTimes, { Datum: dDatum });
          }

          return await Client.deep(this.getModel(ServiceNames.WORKTIME), 'FlexTimeSummary', {
            ...mSummary,
            Accty: this.sAccty,
            Pernr: this.getAppointeeProperty('Pernr'),
            AssoFlexTimeDetailSet: aDetails,
            AssoFlexTimeBreakSet: aBreakTimes,
          });
        } catch (oError) {
          throw oError;
        }
      },
    });
  }
);
