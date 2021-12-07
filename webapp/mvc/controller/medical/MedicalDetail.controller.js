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
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.medical.MedicalDetail', {
      TYPE_CODE: 'HR09',
      LIST_PAGE_ID: 'container-ehr---medical',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          ViewKey: '',
          FormData: {},
          HisList: [
            {
              MaxDate: new Date().MaxDate(new Date().getFullYear())
            },
            {
              Seqnr: '',
              ZappStat: '',
              Begda: '',
              Endda: '',
              Apcnt: '',
              Apbet: '',
              Pvcnt: '',
              Recpgb: '',
              Bet02: '',
              Bett0t: '',
              Prate: '',
              Pybet: '',
            },
          ],
          TargetList: [],
          ReceiptType: [],
          Settings: {},
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          busy: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/ViewKey', sDataKey);

        try {
          const oDetailModel = this.getViewModel();
          const aAppList = await this.getTargetList();
  
          oDetailModel.setProperty('/TargetList', new ComboEntry({ codeKey: 'Znametx', valueKey: 'Seqnr', aEntries: aAppList }));
          
          const aReceipt = await this.getReceiptList();
          
          oDetailModel.setProperty('/ReceiptType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aReceipt }));

          this.setFormData();
          this.settingsAttachTable();
        } catch {
          // MessageBox.error(AppUtils.parseError(oError));
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // FormData Settings
      setFormData() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sViewKey = oDetailModel.getProperty('/ViewKey');
        const sWerks = this.getSessionProperty('Werks');
        let sMsg = '';

        if (sWerks === '1000' || sWerks === '2000') {
          sMsg = `<p>${this.getBundleText('MSG_09015')}</p>`;
        } else {
          sMsg = `<p>${this.getBundleText('MSG_09016')}</p>`;
        }

        oDetailModel.setProperty(
          '/InfoMessage',
          `<p>${this.getBundleText('MSG_09002')}</p>
          <p>${this.getBundleText('MSG_09003')}</p>
          <p>${this.getBundleText('MSG_09004')}</p>
          <p>${this.getBundleText('MSG_09005')}</p>
          <ul>
          <li>${this.getBundleText('MSG_09006')}
          <ul>
          <li>${this.getBundleText('MSG_09007')}</li>
          <li>${this.getBundleText('MSG_09008')}</li>
          <li>${this.getBundleText('MSG_09009')}</li>
          <li>${this.getBundleText('MSG_09010')}</li>
          <li>${this.getBundleText('MSG_09011')}</li>
          <li>${this.getBundleText('MSG_09012')}</li>
          <li>${this.getBundleText('MSG_09013')}</li>
          <li>${this.getBundleText('MSG_09014')}</li>
          </ul>
          </li>
          </ul>
          ${sMsg}`
        );

        if (sViewKey === 'N' || !sViewKey) {
          const oAppointeeData = this.getAppointeeData();

          // oDetailModel.setProperty('/FormData/Appernr', oAppointeeData.Pernr);
          oDetailModel.setProperty('/FormData/Seqnr', 'ALL');
          oDetailModel.setProperty('/FormData/Recpgb', 'ALL');

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: oAppointeeData.Ename,
            Aporgtx: `${oAppointeeData.Btrtx}/${oAppointeeData.Orgtx}`,
            Apjikgbtl: `${oAppointeeData.Zzjikgbt}/${oAppointeeData.Zzjiktlt}`,
          });
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
          oSendObject.MedExpenseItemSet = [];

          oDetailModel.setProperty('/hisBusy', true);

          oModel.create('/MedExpenseApplSet', oSendObject, {
            success: (oData) => {
              if (oData) {
                const oTargetData = oData;
                const oTable = this.byId('medHisTable');
                const oHisList = oData.results.MedExpenseItemSet;

                oDetailModel.setProperty('/FormData', oTargetData);
                oDetailModel.setProperty('/ApplyInfo', oTargetData);
                oDetailModel.setProperty('/HisList', oHisList);
                oDetailModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: oHisList, sStatCode: 'Lnsta' }));

                if (oTargetData.Lnsta === '40' || oTargetData.Lnsta === '60') {
                  const iHistoryLength = oData.LoanAmtRecordSet.results.length;

                  oDetailModel.setProperty('/RepayList', oData.LoanAmtHistorySet.results);
                  oDetailModel.setProperty('/RepayHisList', oData.LoanAmtRecordSet.results);
                  oDetailModel.setProperty('/RepayHisLength', iHistoryLength > 10 ? 10 : iHistoryLength);
                }

                this.getLoanCost(oTargetData.Lntyp);
                oDetailModel.setProperty('/hisBusy', false);
              }
            },
            error: (oError) => {
              const vErrorMSG = AppUtils.parseError(oError);

              MessageBox.error(vErrorMSG);
              oDetailModel.setProperty('/hisBusy', false);
            },
          });
        }
      },

      async getReceiptList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const sWerks = this.getSessionProperty('Werks');

        return new Promise((resolve, reject) => {
          // 영수증구분
          oModel.read('/BenefitCodeListSet', {
            filters: [
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, sWerks),
              new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0017'),
              new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000010'),
              new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'RCTYP'),
              new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            ],
            success: (oData) => {
              if (oData) {
                resolve(oData.results);
              }
            },
            error: (oError) => {
              reject(oError);
              const vErrorMSG = AppUtils.parseError(oError);

              MessageBox.error(vErrorMSG);
            },
          });
        })
      },

      async getTargetList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);

        return new Promise((resolve, reject) => {
          // 신청대상
          oModel.read('/MedExpenseSupportListSet', {
            filters: [new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date())],
            success: (oData) => {
              if (oData) {
                resolve(oData.results);
              }
            },
            error: (oError) => {
              reject(oError);
              const vErrorMSG = AppUtils.parseError(oError);

              MessageBox.error(vErrorMSG);
            },
          });
        })
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

                oSendObject = oFormData;
                oSendObject.Prcty = 'T';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
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

                oSendObject = oFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
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
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
