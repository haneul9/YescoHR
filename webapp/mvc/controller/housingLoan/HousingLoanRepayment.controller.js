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
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
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
    ODataReadError,
    ODataCreateError,
    ODataDeleteError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.housingLoan.HousingLoanRepayment', {
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

        const oDetailModel = this.getViewModel();

        if (!!oParameter.lonid) {
          const sLonid = oParameter.lonid;

          oDetailModel.setProperty('/ViewLonid', sLonid);
        }

        oDetailModel.setProperty('/ViewKey', sDataKey);

        this.getList();
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_07034');
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR08';
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
      async setInitDialogData() {
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
        const mDetailData = oListView.getModel().getProperty('/FormData');
        const oDetailModel = this.getViewModel();

        await this.getRepayType('');

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
      async onSelectRow(oEvent) {
        const oDetailModel = this.getViewModel();
        let oRowData = '';

        if (!oEvent.Appno) {
          const vPath = oEvent.getParameters().rowBindingContext.getPath();
          oRowData = $.extend(true, {}, oDetailModel.getProperty(vPath));
        } else {
          oRowData = oEvent;
        }

        await this.getRepayType(oRowData.Lnsta);

        if (!this.byId('RepayApplyDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.housingLoan.fragment.RepayApplyDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
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

      // 통합 신청함에서 바로 들어올 경우 상세조회 호출
      repayDetail() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        let oSendObject = {};

        oSendObject.Appbox = 'X';
        oSendObject.Pernr = this.getAppointeeProperty('Pernr');
        oSendObject.Menid = this.getCurrentMenuId();
        oSendObject.Prcty = 'D';
        oSendObject.Appno = this.getViewModel().getProperty('/ViewLonid');
        oSendObject.LoanAmtHistorySet = [];
        oSendObject.LoanAmtRecordSet = [];

        return new Promise((resolve, reject) => {
          oModel.create('/LoanAmtApplSet', oSendObject, {
            success: (oData) => {
              if (oData) {
                this.debug(`${'/LoanAmtApplSet'} success.`, oData);
                resolve(oData);
              }
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
              reject();
            },
          });
        });
      },

      // 화면관련 List호출
      async getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oAppointeeData = this.getAppointeeData();
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
        const bRouteAppBox = !!oListView && oListView.getModel().getProperty('/FormData');
        let mDetailData = '';

        if (bRouteAppBox) {
          mDetailData = oListView.getModel().getProperty('/FormData');
        } else {
          mDetailData = await this.repayDetail();
        }

        return Promise.all([
          new Promise((resolve) => {
            // 입금계좌
            oModel.read('/BenefitCodeListSet', {
              filters: [new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0015'), new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oAppointeeData.Werks), new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()), new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000003'), new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'IN'), new sap.ui.model.Filter('Comcd', sap.ui.model.FilterOperator.EQ, 'BANK')],
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
                AppUtils.handleError(new ODataReadError(oError));
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
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
          new Promise((resolve) => {
            // 신청내역
            oModel.read('/LoanRepayApplSet', {
              filters: [new sap.ui.model.Filter('Lonid', sap.ui.model.FilterOperator.EQ, mDetailData.Lonid), new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, mDetailData.Lntyp), new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L')],
              success: (oData) => {
                if (oData) {
                  const oTable = this.byId('repaymentTable');
                  const aList = oData.results;

                  oDetailModel.setProperty('/LoanAppList', aList);

                  setTimeout(() => {
                    oDetailModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aList, sStatCode: 'Lnsta' }));

                    if (!bRouteAppBox) {
                      this.onSelectRow(_.each(aList, (v) => (v.Appno = oDetailModel.getProperty('/ViewKey')))[0]);
                    }

                    resolve();
                  }, 100);
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
        ]);
      },

      // 상환유형 Code호출
      getRepayType(sLnsta) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oAppointeeData = this.getAppointeeData();

        return new Promise((resolve, reject) => {
          oModel.read('/BenefitCodeListSet', {
            filters: [
              // prettier 방지주석
              new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0016'),
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oAppointeeData.Werks),
              new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            ],
            success: (oData) => {
              if (oData) {
                let aList = oData.results;

                if (!sLnsta || sLnsta === '10') {
                  aList = _.filter(aList, (e) => {
                    return e.Zcode !== 'PAY';
                  });
                }

                oDetailModel.setProperty('/LaonType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
                resolve();
              }
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
              reject();
            },
          });
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

        aFiltList.push(new sap.ui.model.Filter('Lonid', sap.ui.model.FilterOperator.EQ, mDialogData.Lonid), new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, mDialogData.Lntyp), new sap.ui.model.Filter('Rptyp', sap.ui.model.FilterOperator.EQ, sKey1));
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
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      // 상환신청
      async onRepayDetailApp() {
        this.setInitDialogData();

        if (!this.byId('RepayApplyDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.housingLoan.fragment.RepayApplyDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
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
        if (!AttachFileAction.getFileCount.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_00046'));
          return true;
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/DialogData/Appno', '');
        oDetailModel.setProperty('/DialogData/Lnsta', '');
        this.settingsAttachTable();
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/DialogData/Appno');
        const oDialogData = oDetailModel.getProperty('/DialogData');
        const oRepayDialog = this.byId('RepayApplyDialog');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                oRepayDialog.setBusy(true);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/DialogData/Appno', sAppno);
                  oDetailModel.setProperty('/DialogData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = oDialogData;
                oSendObject.Prcty = 'T';
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oDialogData.Appno, this.getApprovalType());

                await new Promise((resolve, reject) => {
                  oModel.create('/LoanRepayApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({ oError }));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (oError) {
                AppUtils.handleError(oError);
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
        const sAppno = oDetailModel.getProperty('/DialogData/Appno');
        const oDialogData = oDetailModel.getProperty('/DialogData');
        const oRepayDialog = this.byId('RepayApplyDialog');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                oRepayDialog.setBusy(true);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/DialogData/Appno', sAppno);
                  oDetailModel.setProperty('/DialogData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = oDialogData;
                oSendObject.Prcty = 'C';
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oDialogData.Appno, this.getApprovalType());

                await new Promise((resolve, reject) => {
                  oModel.create('/LoanRepayApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({ oError }));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.byId('RepayApplyDialog').close();
                  },
                });
              } catch (oError) {
                AppUtils.handleError(oError);
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
                error: (oError) => {
                  AppUtils.handleError(new ODataCreateError({ oError }));
                  oRepayDialog.setBusy(false);
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
                error: (oError) => {
                  AppUtils.handleError(new ODataDeleteError(oError));
                  oRepayDialog.setBusy(false);
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
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 1,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
