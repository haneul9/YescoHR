sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    Validator,
    BaseController
  ) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.documentSubmitMng.Detail', {
      MODE: 'N',
      PRE_ROUTE_NAME: null,
      LIST_TABLE_ID: 'targetEmployeeTable',

      rowHighlight(sValue) {
        const vValue = !!sValue ? 1 : 0;

        switch (vValue) {
          case 0:
            // 미제출
            return sap.ui.core.IndicationColor.Indication03;
          case 1:
            // 제출완료
            return sap.ui.core.IndicationColor.Indication04;
          default:
            return null;
        }
      },

      initializeModel() {
        return {
          auth: 'E',
          mode: 'N',
          editorBoxHeight: '500px',
          contentsBusy: {
            page: false,
            button: false,
            form: false,
            table: false,
            preview: false,
          },
          entry: {
            Hrdoc: [],
          },
          param: {
            werks: '',
            hrdoc: '',
            seqnr: '',
          },
          form: {
            Werks: '',
            Hrdoc: '',
            Seqnr: '',
            Begda: '',
            Endda: '',
            Status: '',
            Hrdoctx: '',
            Hrdocttl: '',
            Tgempcnt: '',
            Smempcnt: '',
          },
          listInfo: {
            rowCount: 0,
          },
          list: [],
        };
      },

      onAfterShow() {
        BaseController.prototype.onAfterShow.apply(this, arguments);

        const oTable = this.byId(this.LIST_TABLE_ID);

        if (oTable) this.TableUtils.clearTable(oTable);
      },

      async onObjectMatched(oParameter, sRouteName) {
        this.MODE = oParameter.werks !== 'N' ? 'M' : 'N';
        this.PRE_ROUTE_NAME = _.chain(sRouteName).split('-', 1).head().value();

        const oViewModel = this.getViewModel();
        oViewModel.setData(this.initializeModel());

        try {
          this.setContentsBusy(true);

          oViewModel.setProperty('/auth', this.getCurrentAuthChar());
          oViewModel.setProperty('/mode', this.MODE);

          if (this.MODE === 'M') {
            oViewModel.setProperty('/param', oParameter);
            await Promise.all([
              this.retrieveHrDocManage(), //
              this.retrieveHrDocEmplist(),
            ]);
          }

          await this.retrieveHrdocEntry();
        } catch (oError) {
          this.debug('Controller > documentSubmitMng Detail > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      validRequiredInputData() {
        const oViewModel = this.getViewModel();
        const mFieldValue = oViewModel.getProperty('/form');
        const aFieldProperties = [
          { field: 'Hrdocttl', label: 'LABEL_48006', type: Validator.INPUT1 }, // 제목
          { field: 'Hrdoc', label: 'LABEL_47001', type: Validator.SELECT2 }, // HR문서
          { field: 'Begda', label: 'LABEL_48001', type: Validator.INPUT1 }, // 제출기간
        ];

        if (!Validator.check({ mFieldValue, aFieldProperties })) return true;

        const aRowData = oViewModel.getProperty('/list');

        if (aRowData.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00063')); // 대상자는 한 건 이상 등록하셔야 합니다.
          return true;
        }
        //  else if (_.toInteger(mFieldValue.Smempcnt) > 0) {
        //   MessageBox.alert(this.getBundleText('MSG_48002')); // 이미 제출한 인원이 존재하여 HR문서 변경은 불가합니다.\n삭제 후 재생성 하시기 바랍니다.
        //   return true;
        // }

        return false;
      },

      getEmployeeSearchDialogCustomOptions() {
        const sWerks = this.getAppointeeProperty('Werks');

        return {
          searchConditions: {
            Persa: sWerks.replace(/0000/, ''),
          },
        };
      },

      getEmployeeSearchMultiSelect() {
        return true;
      },

      // [{ Pernr, Ename, Zzjikgb, Zzjikgbt: Zzjikgbtx, Zzjikch, Zzjikcht: Zzjikchtx, Orgeh, Orgtx }]
      callbackAppointeeChange(aEmployeeData) {
        const oViewModel = this.getViewModel();
        const oTable = this.byId(this.LIST_TABLE_ID);
        const aTableList = oViewModel.getProperty('/list');

        const aAddedData = _.chain(aEmployeeData)
          .filter((el) => !_.some(aTableList, (d) => d.Pernr === el.Pernr))
          .map((el) => ({ ...el, Werks: el.Persa, Orgtx: el.Fulln, Zzjikgbtx: el.Zzjikgbt, Zzjikchtx: el.Zzjikcht }))
          .value();

        oViewModel.setProperty('/listInfo/rowCount', Math.min(this.TableUtils.calculateVisibleRowCount(oTable), aTableList.length + aAddedData.length));
        oViewModel.setProperty('/list', [
          ...aTableList, //
          ...aAddedData,
        ]);
      },

      transformDocument(sHrdochtml, aInputData) {
        try {
          const mInputData = _.chain(aInputData).mapKeys('Ipfld').mapValues('Ipfldcont').value();
          let sTransformHrdochtml = _.replace(sHrdochtml, /<span class="empty-space">&nbsp;<\/span>/g, '');

          _.forOwn(mInputData, async (v, p) => {
            const rPattern = new RegExp(`<span[^>]+?data-placeholder-type=.+?@${p}.+?<\/span>`, 'gi');

            if (_.isEqual('5010', p)) {
              // 임금테이블
              const aRowData = _.split(v, '\\');
              const aTransformHtml = [];
              const sTrTemplate = `<tr class="contents" style="height: 35px;">
              <td style="width: 25%; border-right: 1pt solid #d9d9d9; border-bottom: 1pt solid #d9d9d9; border-left: 1pt solid #d9d9d9; border-image: initial; border-top: none; padding: 0cm 5.4pt; height: 24.1375px;">
              <p style="text-align: center; line-height: 15pt; word-break: keep-all; margin: 0cm 0cm 0.0001pt; font-size: 10pt; font-family: '맑은 고딕';">@text1</p></td>
              <td style="width: 20%; border-top: none; border-left: none; border-bottom: 1pt solid #d9d9d9; border-right: 1pt solid #d9d9d9; padding: 0cm 5.4pt; height: 24.1375px;">
              <p style="text-align: right; word-break: keep-all; margin: 0cm 0cm 0.0001pt; font-size: 10pt; font-family: '맑은 고딕';">@text2</p></td>
              <td style="width: 55%; border-top: none; border-left: none; border-bottom: 1pt solid #d9d9d9; border-right: 1pt solid #d9d9d9; padding: 0cm 5.4pt; height: 24.1375px;">
              <p style="text-align: left; margin: 0cm 0cm 0.0001pt; font-size: 10pt; font-family: '맑은 고딕';">@text3</p></td></tr>`;

              aRowData.forEach((row) => {
                const aCellData = _.split(row, '/');

                aTransformHtml.push(
                  _.chain(sTrTemplate)
                    .replace(/@text1/g, aCellData[0])
                    .replace(/@text2/g, aCellData[1])
                    .replace(/@text3/g, aCellData[2])
                    .value()
                );
              });

              sTransformHrdochtml = _.replace(sTransformHrdochtml, /<tr class=\"contents.+?<\/tr>/gis, _.join(aTransformHtml, ''));
            } else if (_.isEqual('1040', p)) {
              // 회사직인
              sTransformHrdochtml = _.replace(sTransformHrdochtml, rPattern, `<img src="data:image/bmp;base64,${btoa(v)}" style="max-width:100%;height:auto;" />`);
            } else if (_.isEqual('1050', p)) {
              // 본인서명
              const sReplaceTag = !!v ? `<img src="${v}" style="max-width:100%;height:auto;" />` : `<img class="preview-signature" style="max-width:100%;height:auto;" />`;

              sTransformHrdochtml = _.replace(sTransformHrdochtml, rPattern, sReplaceTag);
            } else {
              sTransformHrdochtml = _.replace(sTransformHrdochtml, rPattern, `<span style="font-size: 10pt;">${v}</span>`);
            }
          });

          return sTransformHrdochtml;
        } catch (oError) {
          throw oError;
        }
      },

      async createProcess() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.PA);
          const mFormData = _.cloneDeep(oViewModel.getProperty('/form'));
          const aEmpList = _.cloneDeep(oViewModel.getProperty('/list'));

          await Client.create(oModel, 'HrDocManage', {
            Prcty: this.MODE === 'N' ? 'C' : 'M',
            Actty: oViewModel.getProperty('/auth'),
            Werks: mFormData.Werks || this.getAppointeeProperty('Werks'),
            ..._.chain(mFormData).pick(['Hrdoc', 'Seqnr', 'Hrdocttl', 'Begda', 'Endda']).omitBy(_.isNil).value(),
            HrDocNav: _.map(aEmpList, (el) => ({ ...el, Hrdoc: mFormData.Hrdoc })),
          });

          // {저장}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', this.getBundleText('LABEL_00103')), {
            onClose: () => this.getRouter().navTo(this.PRE_ROUTE_NAME),
          });
        } catch (oError) {
          throw oError;
        }
      },

      onSave() {
        if (this.validRequiredInputData()) return;

        this.setContentsBusy(true);

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), MessageBox.Action.CANCEL],
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              this.setContentsBusy(false);
              return;
            }

            try {
              await this.createProcess();
            } catch (oError) {
              this.debug('Controller > documentSubmitMng Detail > onSave Error', oError);

              AppUtils.handleError(oError);
            } finally {
              this.setContentsBusy(false);
            }
          },
        });
      },

      onDelete() {
        const oViewModel = this.getViewModel();

        this.setContentsBusy(true);

        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00114'), MessageBox.Action.CANCEL],
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              this.setContentsBusy(false);
              return;
            }

            try {
              const oModel = this.getModel(ServiceNames.PA);
              const mFormData = _.cloneDeep(oViewModel.getProperty('/form'));

              await Client.remove(oModel, 'HrDocManage', _.pick(mFormData, ['Werks', 'Hrdoc', 'Seqnr']));

              // {삭제}되었습니다.
              MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => this.getRouter().navTo(this.PRE_ROUTE_NAME),
              });
            } catch (oError) {
              this.debug('Controller > documentSubmitMng Detail > onDelete Error', oError);

              AppUtils.handleError(oError);
            } finally {
              this.setContentsBusy(false);
            }
          },
        });
      },

      onPressPDFDownload() {
        const oTable = this.byId(this.LIST_TABLE_ID);
        const aSelectedTableData = this.TableUtils.getSelectionData(oTable);

        if (aSelectedTableData.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_49005')); // PDF File 다운로드 할 데이터를 선택하여 주십시오.
          return;
        }

        let iNotSubmitDocument = 0;
        for (const el of aSelectedTableData) {
          if (el.Pdfurl) {
            window.open(el.Pdfurl);
          } else {
            iNotSubmitDocument++;
          }
        }

        if (iNotSubmitDocument > 0) {
          MessageBox.alert(this.getBundleText('MSG_49006')); // PDF파일은 제출완료된 경우에만 다운로드 가능합니다.
        }
      },

      async onPressPreview() {
        const oTable = this.byId(this.LIST_TABLE_ID);
        const aSelectedTableData = this.TableUtils.getSelectionData(oTable);

        if (aSelectedTableData.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_49003')); // 미리보기 할 데이터를 선택하여 주십시오.
          return;
        } else if (aSelectedTableData.length > 1) {
          MessageBox.alert(this.getBundleText('MSG_49004')); // 미리보기 할 데이터를 한 건만 선택하여 주십시오.
          return;
        }

        if (!this.oPreviewDialog) {
          this.oPreviewDialog = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.documentSubmitMng.fragment.Preview',
            controller: this,
          });

          this.oPreviewDialog
            .attachBeforeOpen(() => this.setContentsBusy(true, 'preview'))
            .attachAfterOpen(async () => {
              try {
                const mSelectedData = aSelectedTableData[0] || {};
                const sPrcty = mSelectedData.Smdat ? 'D' : 'S';
                const [mDocument] = await this.retrieveDocument(sPrcty, mSelectedData.Werks, mSelectedData.Pernr);

                if (sPrcty === 'S') {
                  const aInputData = await this.retrieveInputData(mSelectedData.Werks, mSelectedData.Pernr);
                  const sTransformHtml = this.transformDocument(mDocument.Hrdochtml, aInputData);

                  $('.preview-box').html(sTransformHtml);
                } else {
                  $('.preview-box').html(mDocument.Smhtml);
                }

                setTimeout(() => {
                  const oPdfDomElement = document.querySelector('.preview-box');
                  this.PdfUtils.insertWatermark({ oPdfDomElement, sWatermarkText: mDocument.Watermk });

                  this.setContentsBusy(false, 'preview');
                }, 100);
              } catch (oError) {
                this.setContentsBusy(false, 'preview');
                this.debug('Controller > documentSubmitMng Detail > onPressPreview Error', oError);

                AppUtils.handleError(oError);
              }
            });

          this.getView().addDependent(this.oPreviewDialog);
        }

        this.oPreviewDialog.open();
      },

      onPressDelRow() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId(this.LIST_TABLE_ID);
        const aSelectedTableData = this.TableUtils.getSelectionData(oTable);
        const aTableData = oViewModel.getProperty('/list');

        if (aSelectedTableData.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00110')); // {삭제}할 행을 선택하세요.
          return;
        }

        // MSG_48001: 선택한 데이터 중 이미 제출완료된 데이터가 존재합니다.\n그래도 삭제하시겠습니까?
        // MSG_00021: 선택된 행을 삭제하시겠습니까?
        const sConfirmMessageCode = _.some(aSelectedTableData, (el) => !!el.Smdat) ? 'MSG_48001' : 'MSG_00021';

        // 선택된 행을 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText(sConfirmMessageCode), {
          onClose: function (sAction) {
            if (MessageBox.Action.CANCEL === sAction) return;

            const aUnSelectedData = aTableData.filter((el) => {
              return !aSelectedTableData.some(function (d) {
                return el.Pernr === d.Pernr;
              });
            });

            oViewModel.setProperty('/listInfo/rowCount', Math.min(this.TableUtils.calculateVisibleRowCount(oTable), aUnSelectedData.length));
            oViewModel.setProperty('/list', aUnSelectedData);

            oTable.clearSelection();
          }.bind(this),
        });
      },

      async retrieveHrDocManage() {
        const oViewModel = this.getViewModel();

        try {
          const mParam = oViewModel.getProperty('/param');
          const sAuth = oViewModel.getProperty('/auth');

          const [mHeaderData] = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocManage', {
            Actty: sAuth,
            Werks: mParam.werks,
            Hrdoc: mParam.hrdoc,
            Seqnr: mParam.seqnr,
          });

          oViewModel.setProperty('/form', mHeaderData);
        } catch (oError) {
          throw oError;
        }
      },

      async retrieveHrDocEmplist() {
        const oViewModel = this.getViewModel();

        try {
          const oTable = this.byId(this.LIST_TABLE_ID);
          const mParam = oViewModel.getProperty('/param');
          const sAuth = oViewModel.getProperty('/auth');

          const aEmpList = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocEmplist', {
            Actty: sAuth,
            Werks: mParam.werks,
            Hrdoc: mParam.hrdoc,
            Seqnr: mParam.seqnr,
          });

          oViewModel.setProperty('/listInfo/rowCount', Math.min(this.TableUtils.calculateVisibleRowCount(oTable), aEmpList.length));
          oViewModel.setProperty(
            '/list',
            _.map(aEmpList, (el) => ({ ...el, Smtim: this.TimeUtils.nvl(el.Smtim) }))
          );
        } catch (oError) {
          throw oError;
        }
      },

      async retrieveHrdocEntry() {
        const oViewModel = this.getViewModel();

        try {
          const sAuth = oViewModel.getProperty('/auth');
          const sHrdoc = oViewModel.getProperty('/form/Hrdoc') || 'ALL';

          const aRowData = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocument', {
            Actty: sAuth,
            Begda: moment().hours(9).toDate(),
          });

          oViewModel.setProperty('/form/Hrdoc', sHrdoc);
          oViewModel.setProperty('/entry/Hrdoc', new ComboEntry({ codeKey: 'Hrdoc', valueKey: 'Hrdoctx', aEntries: aRowData }));
        } catch (oError) {
          throw oError;
        }
      },

      async retrieveDocument(sPrcty, sWerks, sPernr) {
        const oViewModel = this.getViewModel();

        try {
          const mFormData = oViewModel.getProperty('/form');
          const sAuth = oViewModel.getProperty('/auth');

          return await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocSubmit', {
            Prcty: sPrcty,
            Actty: sAuth,
            Werks: sWerks,
            Pernr: sPernr,
            Hrdoc: mFormData.Hrdoc,
            Seqnr: mFormData.Seqnr,
          });
        } catch (oError) {
          throw oError;
        }
      },

      async retrieveInputData(sWerks, sPernr) {
        const oViewModel = this.getViewModel();

        try {
          const mFormData = oViewModel.getProperty('/form');
          const sAuth = oViewModel.getProperty('/auth');

          return await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocInputField', {
            Actty: sAuth,
            Werks: sWerks,
            Pernr: sPernr,
            Hrdoc: mFormData.Hrdoc,
          });
        } catch (oError) {
          throw oError;
        }
      },
    });
  }
);
