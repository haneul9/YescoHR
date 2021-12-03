/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    FragmentEvent,
    TextUtils,
    TableUtils,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.housingLoan.HousingLoanRepayment', {
      TYPE_CODE: 'HR08',
      LIST_PAGE_ID: 'container-ehr---housingLoanDetail',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          ViewKey: '',
          AccountTxt: '',
          DialogData: {},
          FormData: {},
          Settings: {},
          TargetLoanHis: {},
          LoanAppList: [],
          maxDate: new Date(),
          DateEditable: true,
        });
        this.setViewModel(oViewModel);
      },

      onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;

        if (!sDataKey) {
          MessageBox.alert(this.getBundleText('MSG_00043'), {
            onClose: () => {
              this.getRouter().navTo('housingLoan');
            },
          });
        }

        this.getViewModel().setProperty('/ViewKey', sDataKey);

        this.getList();
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_07034');
      },

      // 원금상환액
      repayCost(oEvent) {
        const oEventSource = oEvent.getSource();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const oDetailModel = this.getViewModel();
        const iPayIntrest = parseInt(oDetailModel.getProperty('/DialogData/RpamtMin'));
        const iRepay = parseInt(sValue);

        if (iRepay > parseInt(oDetailModel.getProperty('/TargetLoanHis/RpamtBal'))) {
          const sBeforeRepay = oDetailModel.getProperty('/DialogData/RpamtMpr');

          oEventSource.setValue(this.TextUtils.toCurrency(sBeforeRepay));
          oDetailModel.setProperty('/DialogData/RpamtMpr', sBeforeRepay);
          MessageBox.alert(this.getBundleText('MSG_07023'));
        } else {
          oEventSource.setValue(sValue);
          oDetailModel.setProperty('/DialogData/RpamtMpr', sValue);
          oDetailModel.setProperty('/DialogData/RpamtTot', String(iRepay + iPayIntrest));
        }
      },

      // DialogData setting
      setInitDialogData() {
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
        const mDetailData = oListView.getModel().getProperty('/FormData');
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/DialogData', mDetailData);
        oDetailModel.setProperty('/DialogData/Appda', new Date());
        oDetailModel.setProperty('/DialogData/Appno', '');
        oDetailModel.setProperty('/DialogData/Lnsta', '');
        oDetailModel.setProperty('/DialogData/Lnstatx', '');
        oDetailModel.setProperty('/DialogData/Rptyp', 'ALL');
        oDetailModel.setProperty('/DialogData/Paydt', new Date());
        oDetailModel.setProperty('/DialogData/Lnrte', oDetailModel.getProperty('/TargetLoanHis/Lnrte'));
        oDetailModel.setProperty('/DialogData/RpamtMpr', oDetailModel.getProperty('/TargetLoanHis/RpamtBal'));
        oDetailModel.setProperty('/DialogData/RpamtTot', oDetailModel.getProperty('/TargetLoanHis/RpamtBal'));
        oDetailModel.setProperty('/DialogData/Account', oDetailModel.getProperty('/AccountTxt'));
        oDetailModel.setProperty('/DateEditable', true);
      },

      // 상환신청내역 Excel
      onPressExcelDownload() {
        const oTable = this.byId('repaymentTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_07036');

        TableUtils.export({ oTable, aTableData, sFileName });
      },

      // Dialog 닫기
      onClose() {
        this.byId('RepayApplyDialog').close();
      },

      // 상환신청내역 클릭
      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oDetailModel = this.getViewModel();
        const oRowData = $.extend(true, {}, oDetailModel.getProperty(vPath));

        this.getRepayType();

        if (!this.byId('RepayApplyDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.housingLoan.fragment.RepayApplyDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            oDetailModel.setProperty('/DialogData', oRowData);
            oDetailModel.setProperty('/DateEditable', oRowData.Rptyp === 'FULL');
            this.settingsAttachTable();
            oDialog.open();
          });
        } else {
          oDetailModel.setProperty('/DialogData', oRowData);
          oDetailModel.setProperty('/DateEditable', oRowData.Rptyp === 'FULL');
          this.settingsAttachTable();
          this.byId('RepayApplyDialog').open();
        }
      },

      // 화면관련 List호출
      async getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oAppointeeData = this.getAppointeeData();
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
        const mDetailData = oListView.getModel().getProperty('/FormData');

        return Promise.all([
          new Promise((resolve) => {
            // 입금계좌
            oModel.read('/BenefitCodeListSet', {
              filters: [
                new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0015'),
                new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oAppointeeData.Werks),
                new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
                new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000003'),
                new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'IN'),
                new sap.ui.model.Filter('Comcd', sap.ui.model.FilterOperator.EQ, 'BANK'),
              ],
              success: (oData) => {
                if (oData) {
                  const sText = oData.results[0].Ztext;
                  const sRedText = `<span style='color:red;'>${this.getBundleText('MSG_07020')}</span>`;

                  oDetailModel.setProperty('/AccountTxt', sText);
                  oDetailModel.setProperty(
                    '/InfoMessage',
                    `<p>${this.getBundleText('MSG_07014')}</p>
                    <p>${this.getBundleText('MSG_07018', sText)}</p>
                    <p>${this.getBundleText('MSG_07019', sRedText)}</p>`
                  );

                  resolve();
                }
              },
              error: (oError) => {
                const vErrorMSG = AppUtils.parseError(oError);

                MessageBox.error(vErrorMSG);
              },
            });
          }),
          new Promise((resolve) => {
            // 융자내역
            oModel.read('/LoanRepayHistorySet', {
              filters: [new sap.ui.model.Filter('Lonid', sap.ui.model.FilterOperator.EQ, mDetailData.Lonid), new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, mDetailData.Lntyp)],
              success: (oData) => {
                if (oData) {
                  const oHis = oData.results[0];

                  oDetailModel.setProperty('/TargetLoanHis', oHis);

                  resolve();
                }
              },
              error: (oError) => {
                const vErrorMSG = AppUtils.parseError(oError);

                MessageBox.error(vErrorMSG);
              },
            });
          }),
          new Promise((resolve) => {
            // 신청내역
            oModel.read('/LoanRepayApplSet', {
              filters: [
                new sap.ui.model.Filter('Lonid', sap.ui.model.FilterOperator.EQ, mDetailData.Lonid),
                new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, mDetailData.Lntyp),
                new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
              ],
              success: (oData) => {
                if (oData) {
                  const oTable = this.byId('repaymentTable');
                  const aList = oData.results;

                  oDetailModel.setProperty('/LoanAppList', aList);
                  oDetailModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aList, sStatCode: 'Lnsta' }));
                  resolve();
                }
              },
              error: (oError) => {
                const vErrorMSG = AppUtils.parseError(oError);

                MessageBox.error(vErrorMSG);
              },
            });
          }),
        ]);
      },

      // 상환유형 Code호출
      getRepayType() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oAppointeeData = this.getAppointeeData();

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0016'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oAppointeeData.Werks),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
          ],
          success: (oData) => {
            if (oData) {
              const aList = oData.results;

              oDetailModel.setProperty('/LaonType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', mEntries: aList }));
            }
          },
          error: (oError) => {
            const vErrorMSG = AppUtils.parseError(oError);

            MessageBox.error(vErrorMSG);
          },
        });
      },

      // 상환유형선택
      onLaonType(oEvent) {
        const sKey = oEvent.getSource().getSelectedKey();

        if (sKey === 'ALL') {
          return;
        } else if (sKey === 'FULL') {
          this.getViewModel().setProperty('/DialogData/Paydt', new Date());
        }

        this.setLoanType('Type', sKey);
      },

      // 상환일 선택
      onPayDateChange(oEvent) {
        const sDateValue = oEvent.getSource().getDateValue();

        if (this.getViewModel().getProperty('/DialogData/Rptyp') === 'ALL') return;

        this.setLoanType('Date', sDateValue);
      },

      // 상환에따른 데이터셋팅
      setLoanType(sType, sKey) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');
        const aFiltList = [];
        let sKey1 = '';
        let sDate = '';

        if (sType === 'Type') {
          sKey1 = sKey;
          sDate = mDialogData.Paydt;
        } else {
          sKey1 = mDialogData.Rptyp;
          sDate = sKey;
        }

        aFiltList.push(
          new sap.ui.model.Filter('Lonid', sap.ui.model.FilterOperator.EQ, mDialogData.Lonid),
          new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, mDialogData.Lntyp),
          new sap.ui.model.Filter('Rptyp', sap.ui.model.FilterOperator.EQ, sKey1)
        );
        if (sKey1 === 'FULL') {
          aFiltList.push(new sap.ui.model.Filter('Paydt', sap.ui.model.FilterOperator.EQ, sDate), new sap.ui.model.Filter('RpamtMpr', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetLoanHis/RpamtBal')));
          oDetailModel.setProperty('/DateEditable', true);
        } else {
          oDetailModel.setProperty('/DateEditable', false);
        }

        oModel.read('/LoanRepayCheckSet', {
          filters: aFiltList,
          success: (oData) => {
            if (oData) {
              const oAmount = oData.results[0];

              if (sType === 'Type' && sKey !== 'FULL') {
                oDetailModel.setProperty('/DialogData/Paydt', oAmount.Paydt);
              }

              oDetailModel.setProperty('/DialogData/RpamtMpr', oAmount.RpamtMpr);
              oDetailModel.setProperty('/DialogData/RpamtMin', oAmount.RpamtMin);
              oDetailModel.setProperty('/DialogData/RpamtTot', oAmount.RpamtTot);
            }
          },
          error: (oError) => {
            const vErrorMSG = AppUtils.parseError(oError);

            MessageBox.error(vErrorMSG);
          },
        });
      },

      // 상환신청
      onRepayDetailApp() {
        this.getRepayType();
        this.setInitDialogData();

        if (!this.byId('RepayApplyDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.housingLoan.fragment.RepayApplyDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            this.settingsAttachTable();

            oDialog.open();
          });
        } else {
          this.settingsAttachTable();
          this.byId('RepayApplyDialog').open();
        }
      },

      // 상환신청
      onRepayApp() {
        const sAppno = this.getViewModel().getProperty('/FormData/Appno');

        this.getRouter().navTo('housingLoan-repay', { oDataKey: sAppno });
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');

        // 상환유형
        if (mDialogData.Rptyp === 'ALL' || !mDialogData.Rptyp) {
          MessageBox.alert(this.getBundleText('MSG_07015'));
          return true;
        }

        // 상환일
        if (!mDialogData.Paydt) {
          MessageBox.alert(this.getBundleText('MSG_07016'));
          return true;
        }

        // 원금상환액
        if (!mDialogData.RpamtMpr) {
          MessageBox.alert(this.getBundleText('MSG_07017'));
          return true;
        }

        // 첨부파일
        if (!AttachFileAction.getFileLength.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_00045'));
          return true;
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        this.getViewModel().setProperty('/DialogData/Lnsta', '');
      },

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Appno: oDatas.Appno,
          Lntyp: oDatas.Lntyp,
          Lntyptx: oDatas.Lntyptx,
          Lonid: oDatas.Lonid,
          Seqnr: oDatas.Seqnr,
          Pernr: oDatas.Pernr,
          Rptyp: oDatas.Rptyp,
          Rptyptx: oDatas.Rptyptx,
          Lnrte: oDatas.Lnrte,
          Appda: oDatas.Appda,
          Paydt: oDatas.Paydt,
          RpamtMpr: oDatas.RpamtMpr,
          RpamtMin: oDatas.RpamtMin,
          RpamtTot: oDatas.RpamtTot,
          Waers: oDatas.Waers,
          Appno: oDatas.Appno,
          Zfilekey: oDatas.Zfilekey,
          Lnsta: oDatas.Lnsta,
          Lnstatx: oDatas.Lnstatx,
          ZappResn: oDatas.ZappResn,
          Account: oDatas.Account,
          Prcty: oDatas.Prcty,
        };

        return oSendObject;
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/DialogData/Lnsta');
        const oDialogData = oDetailModel.getProperty('/DialogData');
        const oRepayDialog = this.byId('RepayApplyDialog');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          title: this.getBundleText('LABEL_07001'),
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                oRepayDialog.setBusy(true);

                if (!sStatus) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/DialogData/Appno', vAppno);
                  oDetailModel.setProperty('/DialogData/Appda', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oDialogData);

                oSendObject = oSendData;
                oSendObject.Prcty = 'T';
                oSendObject.Waers = 'KRW';

                // FileUpload
                if (!!AttachFileAction.getFileLength.call(this)) {
                  await AttachFileAction.uploadFile.call(this, oDialogData.Appno, this.TYPE_CODE);
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/LoanRepayApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      const vErrorMSG = AppUtils.parseError(oError);

                      reject(vErrorMSG);
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (error) {
                if (_.has(error, 'code') && error.code === 'E') {
                  MessageBox.error(error.message);
                }
              } finally {
                this.getList();
                oRepayDialog.setBusy(false);
              }
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/DialogData/Lnsta');
        const oDialogData = oDetailModel.getProperty('/DialogData');
        const oRepayDialog = this.byId('RepayApplyDialog');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          title: this.getBundleText('LABEL_07001'),
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                oRepayDialog.setBusy(true);

                if (!sStatus) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/DialogData/Appno', vAppno);
                  oDetailModel.setProperty('/DialogData/Appda', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oDialogData);

                oSendObject = oSendData;
                oSendObject.Prcty = 'C';
                oSendObject.Waers = 'KRW';

                // FileUpload
                if (!!AttachFileAction.getFileLength.call(this)) {
                  await AttachFileAction.uploadFile.call(this, oDialogData.Appno, this.TYPE_CODE);
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/LoanRepayApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      const vErrorMSG = AppUtils.parseError(oError);

                      reject(vErrorMSG);
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.byId('RepayApplyDialog').close();
                  },
                });
              } catch (error) {
                if (_.has(error, 'code') && error.code === 'E') {
                  MessageBox.error(error.message);
                }
              } finally {
                this.getList();
                oRepayDialog.setBusy(false);
              }
            }
          },
        });
      },

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oRepayDialog = this.byId('RepayApplyDialog');

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          title: this.getBundleText('LABEL_07001'),
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              oRepayDialog.setBusy(true);

              let oSendObject = {};

              oSendObject = oDetailModel.getProperty('/DialogData');
              oSendObject.Prcty = 'W';

              oModel.create('/LoanRepayApplSet', oSendObject, {
                success: () => {
                  oRepayDialog.setBusy(false);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.getList();
                      this.byId('RepayApplyDialog').close();
                    },
                  });
                },
                error: (oRespnse) => {
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                  oRepayDialog.setBusy(false);
                  MessageBox.error(vErrorMSG);
                },
              });
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oRepayDialog = this.byId('RepayApplyDialog');

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          title: this.getBundleText('LABEL_07001'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              oRepayDialog.setBusy(true);

              const sPath = oModel.createKey('/LoanRepayApplSet', {
                Lonid: oDetailModel.getProperty('/DialogData/Lonid'),
                Seqnr: oDetailModel.getProperty('/DialogData/Seqnr'),
              });

              oModel.remove(sPath, {
                success: () => {
                  oRepayDialog.setBusy(false);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.getList();
                      this.byId('RepayApplyDialog').close();
                    },
                  });
                },
                error: (oRespnse) => {
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                  oRepayDialog.setBusy(false);
                  MessageBox.error(vErrorMSG);
                },
              });
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/DialogData/Lnsta');
        const sAppno = oDetailModel.getProperty('/DialogData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.TYPE_CODE,
          Appno: sAppno,
          Max: 1,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
