/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    Appno,
    AppUtils,
    ComboEntry,
    TextUtils,
    AttachFileAction,
    ServiceNames,
    MessageBox,
    ODataReadError,
    ODataCreateError,
    ODataDeleteError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.studentFunds.StudentFundsDetail', {
      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          ViewKey: '',
          menId: '',
          FormData: {
            Forsch: false,
          },
          AppTarget: [],
          AcademicSort: [],
          GradeList: [],
          QuarterList: [{ Zcode: 'ALL', Ztext: this.getBundleText('LABEL_00268') }],
          Settings: {},
          busy: false,
          LimitAmountMSG: false,
          MajorInput: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();
        const sMenid = this.getCurrentMenuId();

        oDetailModel.setProperty('/ViewKey', sDataKey);
        oDetailModel.setProperty('/Menid', sMenid);

        this.getList()
          .then(() => {
            this.getTargetData();
            oDetailModel.setProperty('/busy', false);
          })
          .catch((oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR02';
      },

      // 해외학교 체크시
      onCheckBox(oEvent) {
        const bSelected = oEvent.getSource().getSelected();

        if (bSelected) {
          this.getViewModel().setProperty('/FormData/Forsch', 'X');
          this.getSupAmount();
        } else {
          this.getViewModel().setProperty('/FormData/Forsch', '');
          this.totalCost();
        }
      },

      // 학자금 총액에 들어가는 금액입력
      costCalculation(oEvent) {
        this.TextUtils.liveChangeCurrency(oEvent);
        this.totalCost();
      },

      // 장학금 입력시
      onSchoCost(oEvent) {
        this.TextUtils.liveChangeCurrency(oEvent);
      },

      // 지원금액 호출
      getSupAmount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const sUrl = '/SchExpenseLimitAmtSet';

        new Promise((resolve) => {
          oModel.read(sUrl, {
            filters: [new sap.ui.model.Filter('Slart', sap.ui.model.FilterOperator.EQ, oFormData.Slart), new sap.ui.model.Filter('Zname', sap.ui.model.FilterOperator.EQ, oFormData.Zname), new sap.ui.model.Filter('Zzobjps', sap.ui.model.FilterOperator.EQ, oFormData.Zzobjps), new sap.ui.model.Filter('Grdsp', sap.ui.model.FilterOperator.EQ, oFormData.Grdsp), new sap.ui.model.Filter('Zyear', sap.ui.model.FilterOperator.EQ, oFormData.Zyear)],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);
              let oList = [];

              if (oData && !!oData.results.length) {
                oList = oData.results[0];
              }

              oDetailModel.setProperty('/LimitAmount', oList);
              resolve();
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
            },
          });
        }).then(() => {
          this.totalCost();
        });
      },

      // 학자금 총액
      totalCost() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const oLimitData = oDetailModel.getProperty('/LimitAmount');
        const iCostA = parseInt(oFormData.ZbetEntr) || 0;
        const iCostB = parseInt(oFormData.ZbetMgmt) || 0;
        const iCostC = parseInt(oFormData.ZbetClass) || 0;
        const iCostD = parseInt(oFormData.ZbetExer) || 0;
        const iCostE = parseInt(oFormData.ZbetSuf) || 0;
        const iCostF = parseInt(oFormData.ZbetEtc) || 0;
        let iCostG = parseInt(oFormData.ZbetTotl) || 0;

        iCostG = iCostA + iCostB + iCostC + iCostD + iCostE + iCostF;
        oDetailModel.setProperty('/FormData/ZbetTotl', String(iCostG));

        if (!!oLimitData && !!oLimitData.Zbetrg && oLimitData.Zbetrg !== '0' && iCostG > parseInt(oLimitData.Zbetrg)) {
          oDetailModel.setProperty('/FormData/ZpayAmt', oLimitData.Zbetrg);
          oDetailModel.setProperty('/LimitAmountMSG', true);
        } else {
          oDetailModel.setProperty('/FormData/ZpayAmt', String(iCostG));
          oDetailModel.setProperty('/LimitAmountMSG', false);
        }
      },

      // 상세조회
      getTargetData() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sUrl = '/SchExpenseApplSet';
        const sViewKey = oDetailModel.getProperty('/ViewKey');
        const mSessionData = this.getSessionData();

        if (sViewKey === 'N' || !sViewKey) {
          oDetailModel.setProperty('/FormData', mSessionData);
          oDetailModel.setProperty('/FormData', {
            Apename: mSessionData.Ename,
            Appernr: mSessionData.Pernr,
            Zzobjps: 'ALL',
            Slart: 'ALL',
            Grdsp: 'ALL',
            Divcd: 'ALL',
            Zyear: String(new Date().getFullYear()),
          });

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });

          this.setYearsList();
          this.settingsAttachTable();
        } else {
          oModel.read(sUrl, {
            filters: [new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'D'), new sap.ui.model.Filter('Appno', sap.ui.model.FilterOperator.EQ, sViewKey)],
            success: (oData) => {
              if (oData) {
                this.debug(`${sUrl} success.`, oData);

                const oTargetData = oData.results[0];

                oDetailModel.setProperty('/FormData', oTargetData);
                oDetailModel.setProperty('/ApplyInfo', oTargetData);
                oDetailModel.setProperty('/ApprovalDetails', oTargetData);

                this.onShcoolList();
                this.setYearsList();
                this.reflashList(oTargetData.Zzobjps);
                this.settingsAttachTable();
              }
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
            },
          });
        }
      },

      // 화면관련 List호출
      async getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sWerks = this.getSessionProperty('Werks');
        const sSchExpenseUrl = '/SchExpenseSupportListSet';
        const sBenefitUrl = '/BenefitCodeListSet';

        return Promise.all([
          await new Promise((resolve, reject) => {
            // 신청대상 조회
            oModel.read(sSchExpenseUrl, {
              filters: [new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date())],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sSchExpenseUrl} success.`, oData);

                  const aList = oData.results;

                  oDetailModel.setProperty('/AppTarget', new ComboEntry({ codeKey: 'Zzobjps', valueKey: 'Znametx', aEntries: aList }));

                  resolve();
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
          new Promise((resolve, reject) => {
            // 학력구분 조회
            oModel.read(sBenefitUrl, {
              filters: [new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0006'), new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, sWerks), new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date())],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sBenefitUrl} success.`, oData);

                  const aList1 = oData.results;

                  oDetailModel.setProperty('/AcademicSortHide', aList1);
                  oDetailModel.setProperty('/AcademicSort', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList1 }));
                  resolve();
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
          new Promise((resolve, reject) => {
            // 학년 조회
            oModel.read(sBenefitUrl, {
              filters: [new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0004'), new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000002'), new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'GRADE'), new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, sWerks), new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date())],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sBenefitUrl} success.`, oData);

                  const aList = oData.results;

                  oDetailModel.setProperty('/GradeList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));

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

      setYearsList() {
        // 학자금 발생년도 셋팅
        const oDetailModel = this.getViewModel();
        const iFullYears = new Date().getFullYear();
        const aYearsList = [];

        aYearsList.push({ Zcode: String(iFullYears), Ztext: `${iFullYears}년` }, { Zcode: String(iFullYears - 1), Ztext: `${iFullYears - 1}년` });

        oDetailModel.setProperty('/FundsYears', aYearsList);

        if (!oDetailModel.getProperty('/FormData/ZappStatAl')) {
          oDetailModel.setProperty('/FormData/Zyear', aYearsList[0].Zcode);
          this.getSupAmount();
        }
      },

      // 신청대상 선택시
      onTargetChange(oEvent) {
        const sSelectedKey = oEvent.getSource().getSelectedKey();
        const oDetailModel = this.getViewModel();

        if (sSelectedKey === 'ALL') return;

        this.reflashList(sSelectedKey);

        const sSlartKey = oDetailModel.getProperty('/FormData/Slart');

        if (sSlartKey === '05' || sSlartKey === '06') {
          oDetailModel.setProperty('/MajorInput', true);
        } else {
          oDetailModel.setProperty('/MajorInput', false);
        }

        oDetailModel.setProperty('/FormData/Schtx', '');
        oDetailModel.setProperty('/FormData/Majnm', '');

        this.getSupAmount();
        this.getApplyNumber();
      },

      // 학력구분List 다시셋팅
      async reflashList(sKey) {
        const oDetailModel = this.getViewModel();
        const aList1 = oDetailModel.getProperty('/AcademicSortHide');
        let aList2 = [];

        if (sKey === '00') {
          aList1.forEach((e) => {
            if (e.Zcode === '06') {
              aList2.push(e);
            }
          });

          if (!oDetailModel.getProperty('/FormData/ZappStatAl')) {
            oDetailModel.setProperty('/FormData/Slart', aList2[0].Zcode);
            const aList = await this.getQuarterList(aList2[0].Zcode);

            oDetailModel.setProperty('/QuarterList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
          }

          aList2 = aList2;
        } else {
          aList2 = aList1;
        }

        oDetailModel.setProperty('/AcademicSort', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList2 }));
      },

      // 지원횟수 조회
      getApplyNumber() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const sUrl = '/SchExpenseCntSet';

        oDetailModel.getProperty('/AppTarget').forEach((e) => {
          if (e.Zzobjps === oFormData.Zzobjps) {
            oDetailModel.setProperty('/FormData/Kdsvh', e.Kdsvh);
            oDetailModel.setProperty('/FormData/Zname', e.Zname);
          }
        });

        oModel.read(sUrl, {
          filters: [new sap.ui.model.Filter('Zname', sap.ui.model.FilterOperator.EQ, oFormData.Zname), new sap.ui.model.Filter('Slart', sap.ui.model.FilterOperator.EQ, oFormData.Slart), new sap.ui.model.Filter('Zzobjps', sap.ui.model.FilterOperator.EQ, oFormData.Zzobjps)],
          success: (oData) => {
            if (oData) {
              this.debug(`${sUrl} success.`, oData);

              oDetailModel.setProperty('/FormData/Cnttx', oData.results[0].Cnttx);
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      // 학자금 발생년도 클릭
      onYearsSelect() {
        this.getApplyNumber();
        this.getSupAmount();
      },

      onGrade() {
        this.getSupAmount();
      },

      // 학력구분 선택시
      async onShcoolList(oEvent) {
        const oDetailModel = this.getViewModel();
        const vSelected = !oEvent ? oDetailModel.getProperty('/FormData/Slart') : oEvent.getSource().getSelectedKey();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');

        if (vSelected === 'ALL') return;

        if (!sStatus || sStatus === '10') {
          if (vSelected === '05' || vSelected === '06') {
            oDetailModel.setProperty('/MajorInput', true);
          } else {
            oDetailModel.setProperty('/MajorInput', false);
          }

          if (!!oEvent) {
            oDetailModel.setProperty('/FormData/Schtx', '');
            oDetailModel.setProperty('/FormData/Majnm', '');
          }
        }

        this.getApplyNumber();
        this.getSupAmount();

        try {
          const aList = await this.getQuarterList(vSelected);

          oDetailModel.setProperty('/QuarterList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));

          if (!!oEvent) {
            oDetailModel.setProperty('/FormData/Divcd', 'ALL');
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      // 분기/학기
      getQuarterList(sUpcod) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const sUrl = '/BenefitCodeListSet';
        const sWerks = this.getSessionProperty('Werks');

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: [new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0005'), new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, sWerks), new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()), new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, sUpcod)],
            success: (oData) => {
              if (oData) {
                this.debug(`${sUrl} success.`, oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      checkError(AppBtn) {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        // 신청대상
        if (oFormData.Zzobjps === 'ALL' || !oFormData.Zzobjps) {
          MessageBox.alert(this.getBundleText('MSG_03007'));
          return true;
        }

        // 학력구분
        if (oFormData.Slart === 'ALL' || !oFormData.Slart) {
          MessageBox.alert(this.getBundleText('MSG_03008'));
          return true;
        }

        // 학년
        if (oFormData.Grdsp === 'ALL' || !oFormData.Grdsp) {
          MessageBox.alert(this.getBundleText('MSG_03009'));
          return true;
        }

        // 분기/학기
        if (oFormData.Divcd === 'ALL' || !oFormData.Divcd) {
          MessageBox.alert(this.getBundleText('MSG_03010'));
          return true;
        }

        // 학교명
        if (!oFormData.Schtx) {
          MessageBox.alert(this.getBundleText('MSG_03003'));
          return true;
        }

        // 수업료
        if (!oFormData.ZbetClass) {
          MessageBox.alert(this.getBundleText('MSG_03004'));
          return true;
        }

        // 첨부파일
        if (!AttachFileAction.getFileCount.call(this) && AppBtn === 'O') {
          MessageBox.alert(this.getBundleText('MSG_03005'));
          return true;
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        this.getViewModel().setProperty('/FormData/ZappStatAl', '');
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sStatus || sStatus === '45') {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'T';
                oSendObject.Menid = oDetailModel.getProperty('/Menid');
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.APPTP);

                await new Promise((resolve, reject) => {
                  oModel.create('/SchExpenseApplSet', oSendObject, {
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
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError('O')) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sStatus || sStatus === '45') {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oDetailModel.getProperty('/Menid');
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.APPTP);

                await new Promise((resolve, reject) => {
                  oModel.create('/SchExpenseApplSet', oSendObject, {
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
                    this.onNavBack();
                  },
                });
              } catch (error) {
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
              oSendObject.Menid = oDetailModel.getProperty('/Menid');

              oModel.create('/SchExpenseApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataCreateError({ oError }));
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

              const sPath = oModel.createKey('/SchExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataDeleteError(oError));
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
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.APPTP,
          Appno: sAppno,
          Message: this.getBundleText('MSG_00040'),
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
