/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
	MessageBox,
	Appno,
	AppUtils,
	AttachFileAction,
	ComboEntry,
	FragmentEvent,
	TextUtils,
	TableUtils,
	ODataReadError,
	ODataCreateError,
	ODataDeleteError,
	ServiceNames,
	BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.housingLoan.HousingLoanDetail', {
      TYPE_CODE: 'HR07',
      LIST_PAGE_ID: 'container-ehr---housingLoan',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          menid: '',
          ViewKey: '',
          FormData: {},
          baseArea: {},
          loanAmount: {},
          LaonType: [],
          AssuranceType: [],
          HouseType: [],
          Settings: {},
          RepayList: [],
          RepayHisList: [],
          RepayHisLength: 1,
          hisBusy: false,
          busy: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const sMenid = this.getCurrentMenuId();
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/menid', sMenid);
        oDetailModel.setProperty('/ViewKey', sDataKey);

        this.getList().then(() => {
          this.setFormData();
          oDetailModel.setProperty('/busy', false);
        });
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 상환이력 Excel
      onPressExcelDownload() {
        const oTable = this.byId('repayHisTable');
        const aTableData = this.getViewModel().getProperty('/RepayHisList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_07033');

        TableUtils.export({ oTable, aTableData, sFileName });
      },

      // 융자금액 입력시
      loanCost(oEvent) {
        const oEventSource = oEvent.getSource();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const oDetailModel = this.getViewModel();
        const sAmountCode = this.getViewModel().getProperty('/loanAmount/Code');
        const mFormData = oDetailModel.getProperty('/FormData');

        if (sValue > parseFloat(sAmountCode) && !!mFormData.Lntyp) {
          const sAmountFormat = new Intl.NumberFormat('ko-KR').format(sAmountCode);
          const sFormAmount = new Intl.NumberFormat('ko-KR').format(mFormData.Lnamt);

          // MessageBox.alert(this.getBundleText('MSG_07006', mFormData.Lntyptx, sAmountFormat));
          this.getMonthlyRepayment(sValue);
          oEventSource.setValue(sFormAmount);
          return oDetailModel.setProperty('/FormData/Lnamt', mFormData.Lnamt);
        }

        oEventSource.setValue(sValue);
        oDetailModel.setProperty('/FormData/Lnamt', sValue);
        this.getMonthlyRepayment(sValue);
      },

      // 건평 입력시
      areaSize(oEvent) {
        const oEventSource = oEvent.getSource();
        const sValue = oEvent
          .getParameter('value')
          .trim()
          .replace(/[^\d'.']/g, '');
        const oDetailModel = this.getViewModel();
        const sBaseCode = oDetailModel.getProperty('/baseArea/Code');

        if (sValue > parseFloat(sBaseCode)) {
          MessageBox.alert(this.getBundleText('MSG_07005', sBaseCode));
          return oEventSource.setValue(oDetailModel.getProperty('/FormData/Zsize'));
        }

        oEventSource.setValue(sValue);
      },

      // 상세조회
      setFormData() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sUrl = '/LoanAmtApplSet';
        const sViewKey = oDetailModel.getProperty('/ViewKey');

        const sRedText = `<a href='#' style='color:blue;'>${this.getBundleText('LABEL_00132')}</a>`;

        oDetailModel.setProperty(
          '/InfoMessage',
          `<p>${this.getBundleText('MSG_07021')}</p>
          <p>${this.getBundleText('MSG_07022', sRedText)}</p>`
        );

        if (sViewKey === 'N' || !sViewKey) {
          const oAppointeeData = this.getAppointeeData();

          oDetailModel.setProperty('/FormData/Appernr', oAppointeeData.Pernr);
          oDetailModel.setProperty('/FormData/Lntyp', 'ALL');
          oDetailModel.setProperty('/FormData/Asmtd', 'ALL');
          oDetailModel.setProperty('/FormData/Htype', 'ALL');

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: oAppointeeData.Ename,
            Aporgtx: `${oAppointeeData.Btrtx}/${oAppointeeData.Orgtx}`,
            Apjikgbtl: `${oAppointeeData.Zzjikgbt}/${oAppointeeData.Zzjiktlt}`,
          });

          this.settingsAttachTable();
        } else {
          const oView = this.getView();
          const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
          const mListData = oListView.getModel().getProperty('/parameters');
          let oSendObject = {};

          oSendObject.Prcty = 'D';
          oSendObject.Appno = sViewKey;
          oSendObject.Begda = mListData.Begda;
          oSendObject.Endda = mListData.Endda;
          oSendObject.Lntyp = mListData.Lntyp;
          oSendObject.Seqnr = mListData.Seqnr;
          oSendObject.Pernr = mListData.Pernr;
          oSendObject.LoanAmtHistorySet = [];
          oSendObject.LoanAmtRecordSet = [];

          oDetailModel.setProperty('/hisBusy', true);

          oModel.create(sUrl, oSendObject, {
            success: (oData) => {
              if (oData) {
                this.debug(`${sUrl} success.`, oData);

                const oTargetData = oData;

                oDetailModel.setProperty('/FormData', oTargetData);
                oDetailModel.setProperty('/ApplyInfo', oTargetData);
                // oDetailModel.setProperty('/ApplyInfo/Appdt', oTargetData.Appda);

                if (oTargetData.Lnsta === '40' || oTargetData.Lnsta === '60') {
                  const iHistoryLength = oData.LoanAmtRecordSet.results.length;

                  oDetailModel.setProperty('/RepayList', oData.LoanAmtHistorySet.results);
                  oDetailModel.setProperty('/RepayHisList', oData.LoanAmtRecordSet.results);
                  oDetailModel.setProperty('/RepayHisLength', iHistoryLength > 10 ? 10 : iHistoryLength);
                }

                this.settingsAttachTable();
                this.getLoanCost(oTargetData.Lntyp);
                oDetailModel.setProperty('/hisBusy', false);
              }
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
              oDetailModel.setProperty('/hisBusy', false);
            },
          });
        }
      },

      // 화면관련 List호출
      async getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oAppointeeData = this.getAppointeeData();
        const sBenefitUrl = '/BenefitCodeListSet';

        return Promise.all([
          new Promise((resolve) => {
            // 융자구분
            oModel.read(sBenefitUrl, {
              filters: [
                new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0008'),
                new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oAppointeeData.Werks),
                new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
                new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000004'),
                new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'GRADE'),
              ],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sBenefitUrl} success.`, oData);

                  const aList = oData.results;
                  const aList2 = [];

                  aList.forEach((e) => {
                    if (!e.Zchar1) {
                      aList2.push(e);
                    }
                  });

                  oDetailModel.setProperty('/LaonType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList2 }));

                  resolve();
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
          new Promise((resolve) => {
            // 담보종류
            oModel.read(sBenefitUrl, {
              filters: [new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0009')],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sBenefitUrl} success.`, oData);

                  const aList1 = oData.results;

                  oDetailModel.setProperty('/AssuranceType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList1 }));

                  resolve();
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
          new Promise((resolve) => {
            // 주택종류
            oModel.read(sBenefitUrl, {
              filters: [
                new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0010'),
                new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oAppointeeData.Werks),
                new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
                new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000003'),
                new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'HTYPE'),
              ],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sBenefitUrl} success.`, oData);

                  const aList = oData.results;

                  oDetailModel.setProperty('/HouseType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));

                  resolve();
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
          new Promise((resolve) => {
            // 건평
            oModel.read(sBenefitUrl, {
              filters: [
                new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0011'),
                new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oAppointeeData.Werks),
                new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
                new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000003'),
                new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'OUT'),
                new sap.ui.model.Filter('Comcd', sap.ui.model.FilterOperator.EQ, 'PY'),
              ],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sBenefitUrl} success.`, oData);

                  const mArea = oData.results[0];

                  oDetailModel.setProperty('/baseArea/Text', mArea.Zbigo);
                  oDetailModel.setProperty('/baseArea/Code', mArea.Zchar1);

                  resolve();
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
        ]);
      },

      // 융자금액입력시 금액호출
      getLoanCost(sKey) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oAppointeeData = this.getAppointeeData();
        const sBenefitUrl = '/BenefitCodeListSet';

        oModel.read(sBenefitUrl, {
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0012'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oAppointeeData.Werks),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, sKey),
          ],
          success: (oData) => {
            if (oData) {
              this.debug(`${sBenefitUrl} success.`, oData);

              const oList = oData.results[0];

              oDetailModel.setProperty('/loanAmount/Code', oList.Zbetrg);
              oDetailModel.setProperty('/loanAmount/Text', oList.Zbigo);
              oDetailModel.setProperty('/FormData/Hdprd', oList.Zchar2);
              oDetailModel.setProperty('/FormData/Lnprd', oList.Zchar1);
              oDetailModel.setProperty('/FormData/Lnrte', oList.Zchar5);

              const mFormData = oDetailModel.getProperty('/FormData');
              // let sAmount = mFormData.Lnamt;

              if (!!mFormData.Lnamt) {
                if (parseFloat(mFormData.Lnamt) > parseFloat(oList.Zbetrg)) {
                  MessageBox.alert(this.getBundleText('MSG_07006', mFormData.Lntyptx, new Intl.NumberFormat('ko-KR').format(oList.Zbetrg)));
                  // oDetailModel.setProperty('/FormData/Lnamt', oList.Zbetrg);
                  // sAmount = oList.Zbetrg;
                }

                // this.getMonthlyRepayment(sAmount);
              }
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      // 신청서 출력
      onAppPDF() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sBenefitUrl = '/LoanAmtPrintSet';
        const mFormData = oDetailModel.getProperty('/FormData');

        oModel.read(sBenefitUrl, {
          filters: [
            new sap.ui.model.Filter('Pernr', sap.ui.model.FilterOperator.EQ, mFormData.Pernr),
            new sap.ui.model.Filter('Begda', sap.ui.model.FilterOperator.EQ, mFormData.Begda),
            new sap.ui.model.Filter('Endda', sap.ui.model.FilterOperator.EQ, mFormData.Endda),
            new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, mFormData.Lntyp),
          ],
          success: (oData) => {
            if (oData) {
              const oList = oData.results[0];
              const oViewer = new sap.m.PDFViewer({
                source: oList.Url,
                sourceValidationFailed: function (oEvent) {
                  oEvent.preventDefault();
                },
              });

              oViewer.open();
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },
      // 융자구분 선택시
      onLaonType(oEvent) {
        const oDetailModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        if (sKey === 'ALL' || !sKey) return;

        oDetailModel.getProperty('/LaonType').forEach((e) => {
          if (e.Zcode === sKey) {
            oDetailModel.setProperty('/FormData/Lntyptx', e.Ztext);
          }
        });

        this.getLoanCost(sKey);
      },

      // 융자금액 입력시 월 상환액
      getMonthlyRepayment(sAmount) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sBenefitUrl = '/LoanAmtCheckSet';
        const mFormData = oDetailModel.getProperty('/FormData');

        if (mFormData.Lntyp === 'ALL' || !mFormData.Lntyp) return;

        oModel.read(sBenefitUrl, {
          filters: [
            new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, mFormData.Lntyp),
            new sap.ui.model.Filter('Lnprd', sap.ui.model.FilterOperator.EQ, mFormData.Lnprd),
            new sap.ui.model.Filter('Lnrte', sap.ui.model.FilterOperator.EQ, mFormData.Lnrte),
            new sap.ui.model.Filter('LnamtT', sap.ui.model.FilterOperator.EQ, sAmount),
            // new sap.ui.model.Filter('Waers', sap.ui.model.FilterOperator.EQ, 'KRW'),
          ],
          success: (oData) => {
            if (oData) {
              this.debug(`${sBenefitUrl} success.`, oData);

              const oRepayObj = oData.results[0];

              if(!!oRepayObj.Message) {
                MessageBox.alert(oRepayObj.Message);
                // oDetailModel.setProperty('/FormData/Lnamt', oRepayObj.Mxamt);
              }

              oDetailModel.setProperty('/FormData/RpamtMon', oRepayObj.RpamtMon);
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
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

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/Lnsta');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
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

                oSendObject = oFormData;
                oSendObject.Prcty = 'T';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);

                await new Promise((resolve, reject) => {
                  oModel.create('/LoanAmtApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({oError}));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (oError) {
                AppUtils.handleError(oError);
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

                oSendObject = oFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);

                await new Promise((resolve, reject) => {
                  oModel.create('/LoanAmtApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({oError}));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.getRouter().navTo('housingLoan');
                  },
                });
              } catch (oError) {
                AppUtils.handleError(oError);
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
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              AppUtils.setAppBusy(true, this);

              let oSendObject = {};

              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Menid = oDetailModel.getProperty('/menid');

              oModel.create('/LoanAmtApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.getRouter().navTo('housingLoan');
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataCreateError({oError}));
                  AppUtils.setAppBusy(false, this);
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
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/LoanAmtApplSet', {
                Pernr: oDetailModel.getProperty('/FormData/Pernr'),
                Endda: oDetailModel.getProperty('/FormData/Endda'),
                Begda: oDetailModel.getProperty('/FormData/Begda'),
                Lntyp: oDetailModel.getProperty('/FormData/Lntyp'),
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
                error: (oError) => {
                  AppUtils.handleError(new ODataDeleteError({oError}));
                  AppUtils.setAppBusy(false, this);
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
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
