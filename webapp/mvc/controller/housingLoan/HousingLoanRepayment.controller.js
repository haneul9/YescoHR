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

      onAfterShow() {
        this.getList().then(() => {
          BaseController.prototype.onAfterShow.call(this);
        });
      },

      onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;

        this.getViewModel().setProperty('/ViewKey', sDataKey);
      },

      // 원금상환액
      repayCost(oEvent) {
        const oEventSource = oEvent.getSource();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const oDetailModel = this.getViewModel();

        oEventSource.setValue(sValue);
        oDetailModel.setProperty('/DialogData/RpamtMpr', sValue);
        oDetailModel.setProperty('/DialogData/RpamtTot', sValue);
      },

      // DialogData setting
      setDialogData(oRowData) {
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
        const mDetailData = oListView.getModel().getProperty('/FormData');
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/DialogData', mDetailData);
        oDetailModel.setProperty('/DialogData/Appda', new Date());

        if(!oRowData) {
          oDetailModel.setProperty('/DialogData/Lnsta', '');
          oDetailModel.setProperty('/DialogData/Lnstatx', '');
          oDetailModel.setProperty('/DialogData/Rptyp', 'ALL');
          oDetailModel.setProperty('/DialogData/Paydt', new Date());
          oDetailModel.setProperty('/DialogData/Lnrte', oDetailModel.getProperty('/TargetLoanHis/Lnrte'));
          oDetailModel.setProperty('/DialogData/RpamtMpr', oDetailModel.getProperty('/TargetLoanHis/RpamtBal'));
          oDetailModel.setProperty('/DialogData/RpamtTot', oDetailModel.getProperty('/TargetLoanHis/RpamtBal'));
          oDetailModel.setProperty('/DialogData/Account', oDetailModel.getProperty('/AccountTxt'));
          oDetailModel.setProperty('/DateEditable', true);
        }
      },

      // 상환신청내역 Excel
      onPressExcelDownload() {
        const oTable = this.byId('repaymentTable');
        const mTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_07036');

        TableUtils.export({ oTable, mTableData, sFileName });
      },

      // Dialog 닫기
      onClose() {
        this.byId('RepayApplyDialog').close();
      },

      // 상환신청내역 클릭
      onSelectRow() {

      },

      // 화면관련 List호출
      async getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oTargetInfo = this.getOwnerComponent().getSessionModel().getData();
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
        const mDetailData = oListView.getModel().getProperty('/FormData');

        return Promise.all([
          new Promise((resolve) => {
            // 입금계좌
            oModel.read('/BenefitCodeListSet', {
              filters: [
                new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0015'),
                new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oTargetInfo.Werks),
                new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
                new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000003'),
                new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'IN'),
                new sap.ui.model.Filter('Comcd', sap.ui.model.FilterOperator.EQ, 'BANK'),
              ],
              success: (oData) => {
                if (oData) {
                  const sText = oData.results[0].Ztext;

                  oDetailModel.setProperty('/AccountTxt', sText);
                  oDetailModel.setProperty('/InfoMessage', this.getBundleText('MSG_07014', sText));

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
              filters: [
                new sap.ui.model.Filter('Lonid', sap.ui.model.FilterOperator.EQ, mDetailData.Lonid),
                new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, mDetailData.Lntyp),
              ],
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

                  setTimeout(() => {
                    oDetailModel.setProperty('/listInfo', TableUtils.count({ oTable, mRowData: aList, sStatCode: 'Lnsta' }));
                  }, 100);

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
        const oTargetInfo = this.getOwnerComponent().getSessionModel().getData();

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0016'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oTargetInfo.Werks),
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

        if (sKey === 'ALL') return;

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

        if(sType === 'Type') {
          sKey1 = sKey;
          sDate = mDialogData.Paydt;
        } else {
          sKey1 = mDialogData.Rptyp;
          sDate = sKey;
        }

        aFiltList.push(
          new sap.ui.model.Filter('Lonid', sap.ui.model.FilterOperator.EQ, mDialogData.Lonid),
          new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, mDialogData.Lntyp),
          new sap.ui.model.Filter('Rptyp', sap.ui.model.FilterOperator.EQ, sKey1),
        );
        if (sKey1 === 'FULL') {
          aFiltList.push(
            new sap.ui.model.Filter('Paydt', sap.ui.model.FilterOperator.EQ, sDate),
            new sap.ui.model.Filter('RpamtMpr', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetLoanHis/RpamtBal')),
          );
          oDetailModel.setProperty('/DateEditable', true);
        } else {
          oDetailModel.setProperty('/DateEditable', false);
        }

        oModel.read('/LoanRepayCheckSet', {
          filters: aFiltList,
          success: (oData) => {
            if (oData) {
              const oAmount = oData.results[0];

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
        this.setDialogData();
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
            this.settingsAttachTable();
            
            oDialog.open();
          });
        } else {
          this.settingsAttachTable();
          this.byId('RepayApplyDialog').open();
        }
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        // 융자구분
        if (oFormData.Lntyp === 'ALL' || !oFormData.Lntyp) {
          MessageBox.alert(this.getBundleText('MSG_07007'));
          return true;
        }

        // 담보종류
        if (oFormData.Asmtd === 'ALL' || !oFormData.Asmtd) {
          MessageBox.alert(this.getBundleText('MSG_07008'));
          return true;
        }

        // 주택종류
        if (oFormData.Htype === 'ALL' || !oFormData.Htype) {
          MessageBox.alert(this.getBundleText('MSG_07009'));
          return true;
        }

        // 건평
        if (!oFormData.Zsize) {
          MessageBox.alert(this.getBundleText('MSG_07010'));
          return true;
        }

        // 주소
        if (!oFormData.Addre) {
          MessageBox.alert(this.getBundleText('MSG_07011'));
          return true;
        }

        // 융자금액
        if (!oFormData.Lnamt) {
          MessageBox.alert(this.getBundleText('MSG_07012'));
          return true;
        }

        // 비고
        if (!oFormData.Zbigo) {
          MessageBox.alert(this.getBundleText('MSG_07013'));
          return true;
        }

        return false;
      },

      // 상환신청
      onRepayApp() {
        const sAppno = this.getViewModel().getProperty('/FormData/Appno');

        this.getRouter().navTo('housingLoan-repay', { oDataKey: sAppno });
      },

      // 재작성
      onRewriteBtn() {
        this.getViewModel().setProperty('/FormData/Lnsta', '');
      },

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Appno: oDatas.Appno,
          Appda: oDatas.Appda,
          Appernr: oDatas.Appernr,
          Lnsta: oDatas.Lnsta,
          Lnstatx: oDatas.Lnstatx,
          Htype: oDatas.Htype,
          Htypetx: oDatas.Htypetx,
          Addre: oDatas.Addre,
          RpamtMon: oDatas.RpamtMon,
          Lnrte: oDatas.Lnrte,
          Lntyp: oDatas.Lntyp,
          Lntyptx: oDatas.Lntyptx,
          Asmtd: oDatas.Asmtd,
          Asmtdtx: oDatas.Asmtdtx,
          Zsize: oDatas.Zsize,
          Hdprd: oDatas.Hdprd,
          Lnamt: oDatas.Lnamt,
          Lnprd: oDatas.Lnprd,
          Zbigo: oDatas.Zbigo,
          Lonid: oDatas.Lonid,
          Begda: oDatas.Begda,
          Endda: oDatas.Endda,
          Lntyp: oDatas.Lntyp,
          Pernr: oDatas.Pernr,
        };

        return oSendObject;
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/Lnsta');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          title: this.getBundleText('LABEL_07001'),
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sStatus) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oFormData);

                oSendObject = oSendData;
                oSendObject.Prcty = 'T';
                oSendObject.Actty = 'E';
                oSendObject.Waers = 'KRW';

                // FileUpload
                if (!!AttachFileAction.getFileLength.call(this)) {
                  await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/LoanAmtApplSet', oSendObject, {
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
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/Lnsta');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          title: this.getBundleText('LABEL_07001'),
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sStatus) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oFormData);

                oSendObject = oSendData;
                oSendObject.Prcty = 'C';
                oSendObject.Actty = 'E';
                oSendObject.Waers = 'KRW';

                // FileUpload
                if (!!AttachFileAction.getFileLength.call(this)) {
                  await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/LoanAmtApplSet', oSendObject, {
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
                    this.getRouter().navTo('housingLoan');
                  },
                });
              } catch (error) {
                if (_.has(error, 'code') && error.code === 'E') {
                  MessageBox.error(error.message);
                }
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          title: this.getBundleText('LABEL_07001'),
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              AppUtils.setAppBusy(true, this);

              let oSendObject = {};

              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Actty = 'E';

              oModel.create('/LoanAmtApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.getRouter().navTo('housingLoan');
                    },
                  });
                },
                error: (oRespnse) => {
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                  AppUtils.setAppBusy(false, this);
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

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          title: this.getBundleText('LABEL_07001'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/LoanAmtApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.getRouter().navTo('housingLoan');
                    },
                  });
                },
                error: (oRespnse) => {
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                  AppUtils.setAppBusy(false, this);
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
        const sStatus = oDetailModel.getProperty('/FormData/Lnsta');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

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
