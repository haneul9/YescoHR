/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    Appno,
    AppUtils,
    ComboEntry,
    TextUtils,
    AttachFileAction,
    Client,
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

      initializeModel() {
        return {
          ViewKey: '',
          previousName: '',
          menId: '',
          AmountRate: 0,
          FormData: {
            Forsch: '',
          },
          AppTarget: [],
          AcademicSort: [],
          GradeList: [],
          QuarterList: [{ Zcode: 'ALL', Ztext: this.getBundleText('LABEL_00268') }],
          Settings: {},
          busy: false,
          LimitAmountMSG: false,
          MajorInput: false,
        };
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      getPreviousRouteName() {
        return this.getViewModel().getProperty('/previousName');
      },

      onObjectMatched(oParameter, sRouteName) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();
        const sMenid = this.getCurrentMenuId();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);
        oDetailModel.setProperty('/ViewKey', sDataKey);
        oDetailModel.setProperty('/Menid', sMenid);

        // Input Field Imited
        oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'SchExpenseAppl')));
        oDetailModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());

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
      async onCheckBox(oEvent) {
        const bSelected = oEvent.getSource().getSelected();

        if (bSelected) {
          this.getViewModel().setProperty('/FormData/Forsch', 'X');
          await this.getSupAmount();
          this.totalCost();
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
        const mFilters = _.pick(oFormData, ['Slart', 'Zname', 'Zzobjps', 'Grdsp', 'Zyear']);

        if (this.isHass()) {
          _.set(mFilters, 'Pernr', this.getAppointeeProperty('Pernr'));
        }

        return new Promise((resolve) => {
          oModel.read(sUrl, {
            filters: _.chain(mFilters)
              .omitBy(_.isNil)
              .map((v, p) => new Filter(p, FilterOperator.EQ, v))
              .value(),
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

        const iCostH = _.multiply(iCostG, _.divide(oDetailModel.getProperty('/AmountRate'), 100));

        if (oFormData.Forsch === 'X') {
          if (!!oLimitData && iCostH > _.parseInt(oLimitData.Zbetrg)) {
            if (oFormData.Grdsp !== 'ALL' && oFormData.Divcd !== 'ALL') {
              oDetailModel.setProperty('/FormData/ZpayAmt', oLimitData.Zbetrg);
              oDetailModel.setProperty('/LimitAmountMSG', true);
            }
          } else {
            oDetailModel.setProperty('/FormData/ZpayAmt', String(iCostH));
            oDetailModel.setProperty('/LimitAmountMSG', false);
          }
        } else {
          oDetailModel.setProperty('/FormData/ZpayAmt', String(iCostH));
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
        const mAppointeeData = this.getAppointeeData();

        if (sViewKey === 'N' || !sViewKey) {
          oDetailModel.setProperty('/FormData', mSessionData);
          oDetailModel.setProperty('/FormData', {
            Apename: mSessionData.Ename,
            Appernr: mSessionData.Pernr,
            Ename: mAppointeeData.Ename,
            Pernr: mAppointeeData.Pernr,
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
          const aFilters = [
            // prettier 방지주석
            new Filter('Prcty', FilterOperator.EQ, 'D'),
            new Filter('Appno', FilterOperator.EQ, sViewKey),
          ];

          if (this.isHass()) {
            const sPernr = this.getAppointeeProperty('Pernr');

            aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
          }

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              if (oData) {
                this.debug(`${sUrl} success.`, oData);

                const oTargetData = oData.results[0];

                _.each(oDetailModel.getProperty('/AppTarget'), (e) => {
                  if (e.Zname === oTargetData.Zname) {
                    oTargetData.Zzobjps = e.Zzobjps;
                  }
                });

                oDetailModel.setProperty('/FormData', oTargetData);
                oDetailModel.setProperty('/ApplyInfo', oTargetData);
                oDetailModel.setProperty('/ApprovalDetails', oTargetData);
                this.onShcoolList();
                this.setYearsList();
                this.reflashList(oTargetData.Zzobjps);
                this.settingsAttachTable();

                if (oTargetData.Forsch === 'X' && _.parseInt(oTargetData.ZbetTotl) >= _.parseInt(oTargetData.ZpayAmt)) {
                  oDetailModel.setProperty('/LimitAmountMSG', true);
                }
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
        const aPernr = [];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aPernr.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        return Promise.all([
          await new Promise((resolve) => {
            // 신청대상 조회
            oModel.read(sSchExpenseUrl, {
              filters: [
                // perttier 방지주석
                new Filter('Datum', FilterOperator.EQ, new Date()),
                ...aPernr,
              ],
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
          new Promise((resolve) => {
            // 학력구분 조회
            oModel.read(sBenefitUrl, {
              filters: [
                // perttier 방지주석
                new Filter('Cdnum', FilterOperator.EQ, 'BE0006'),
                new Filter('Werks', FilterOperator.EQ, sWerks),
                new Filter('Datum', FilterOperator.EQ, new Date()),
                ...aPernr,
              ],
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
          new Promise((resolve) => {
            // 학년 조회
            oModel.read(sBenefitUrl, {
              filters: [
                // prettier 방지주석
                ...aPernr,
                new Filter('Cdnum', FilterOperator.EQ, 'BE0004'),
                new Filter('Grcod', FilterOperator.EQ, 'BE000002'),
                new Filter('Sbcod', FilterOperator.EQ, 'GRADE'),
                new Filter('Werks', FilterOperator.EQ, sWerks),
                new Filter('Datum', FilterOperator.EQ, new Date()),
              ],
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

      async setYearsList() {
        // 학자금 발생년도 셋팅
        const oDetailModel = this.getViewModel();
        const iFullYears = new Date().getFullYear();
        const aYearsList = [];

        aYearsList.push({ Zcode: String(iFullYears), Ztext: `${iFullYears}년` }, { Zcode: String(iFullYears - 1), Ztext: `${iFullYears - 1}년` });

        oDetailModel.setProperty('/FundsYears', aYearsList);

        if (!oDetailModel.getProperty('/FormData/ZappStatAl')) {
          oDetailModel.setProperty('/FormData/Zyear', aYearsList[0].Zcode);
          await this.getSupAmount();
          this.totalCost();
        }
      },

      // 신청대상 선택시
      async onTargetChange(oEvent) {
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
        oDetailModel.setProperty('/FormData/Slart', 'ALL');
        oDetailModel.setProperty('/FormData/Divcd', 'ALL');
        await this.getSupAmount();
        this.totalCost();
        this.getApplyNumber();
      },

      // 학력구분List 다시셋팅
      async reflashList(sKey) {
        const oDetailModel = this.getViewModel();
        const aList1 = oDetailModel.getProperty('/AcademicSortHide');
        let aList2 = [];

        if (sKey === '00') {
          // aList1.forEach((e) => {
          //   if (e.Zcode === '06') {
          //     aList2.push(e);
          //   }
          // });
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const mPayLoad = {
            Cdnum: 'BE0006',
            Werks: this.getAppointeeProperty('Werks'),
            Datum: new Date(),
            Grcod: 'BE000002',
            Sbcod: 'BONIN',
          };
          // 학력구분 호출
          const aStuList = await Client.getEntitySet(oModel, 'BenefitCodeList', mPayLoad);

          if (!oDetailModel.getProperty('/FormData/ZappStatAl')) {
            const aList = await this.getQuarterList(aStuList[0].Zcode);

            oDetailModel.setProperty('/QuarterList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
          }

          aList2 = aStuList;
        } else {
          aList2 = aList1;
        }

        oDetailModel.setProperty('/AcademicSort', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList2 }));
        // oDetailModel.setProperty('/FormData/Slart', 'ALL');
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

        const aFilters = [
          // perttier 방지주석
          new Filter('Zname', FilterOperator.EQ, oFormData.Zname),
          new Filter('Slart', FilterOperator.EQ, oFormData.Slart),
          new Filter('Zzobjps', FilterOperator.EQ, oFormData.Zzobjps),
        ];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        oModel.read(sUrl, {
          filters: aFilters,
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
      async onYearsSelect() {
        this.getApplyNumber();
        await this.getSupAmount();
        this.totalCost();
      },

      async onGrade() {
        await this.getSupAmount();
        this.totalCost();
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

        oDetailModel.setProperty(
          '/AmountRate',
          _.chain(oDetailModel.getProperty('/AcademicSort'))
            .find((e) => {
              return vSelected === e.Zcode;
            })
            .get('Zchar1')
            .value()
        );
        await this.getSupAmount();

        if (!!oEvent) {
          this.getApplyNumber();
          this.totalCost();
        }

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
        const aFilters = [
          // prettier 방지주석
          new Filter('Cdnum', FilterOperator.EQ, 'BE0005'),
          new Filter('Werks', FilterOperator.EQ, sWerks),
          new Filter('Datum', FilterOperator.EQ, new Date()),
          new Filter('Upcod', FilterOperator.EQ, sUpcod),
        ];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: aFilters,
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

        oDetailModel.setProperty('/FormData/ZbetSuf', !oFormData.ZbetSuf ? '0' : oFormData.ZbetSuf);

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

        // 지원금액 > 0
        if (!parseInt(oFormData.ZpayAmt) && AppBtn === 'O') {
          MessageBox.alert(this.getBundleText('MSG_03004'));
          return true;
        }

        if (!oFormData.ZbetClass) {
          oDetailModel.setProperty('/FormData/ZbetClass', '0');
        }

        const sWerks = this.getAppointeeProperty('Werks');

        if (!(sWerks === '2000' && (oFormData.Slart === '03' || oFormData.Slart === '04'))) {
          // 첨부파일
          if (!AttachFileAction.getFileCount.call(this) && AppBtn === 'O') {
            MessageBox.alert(this.getBundleText('MSG_03005'));
            return true;
          }
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/FormData/Appno', '');
        oDetailModel.setProperty('/FormData/ZappStatAl', '');
        this.settingsAttachTable();
        this.onShcoolList();
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'T';
                oSendObject.Menid = oDetailModel.getProperty('/Menid');
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.getApprovalType());

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
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError('O')) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oDetailModel.getProperty('/Menid');
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.getApprovalType());

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
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false);
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
              AppUtils.setAppBusy(true);

              let oSendObject = {};

              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Menid = oDetailModel.getProperty('/Menid');

              oModel.create('/SchExpenseApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataCreateError({ oError }));
                  AppUtils.setAppBusy(false);
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
              AppUtils.setAppBusy(true);

              const sPath = oModel.createKey('/SchExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  AppUtils.setAppBusy(false);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataDeleteError(oError));
                  AppUtils.setAppBusy(false);
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
          Type: this.getApprovalType(),
          Appno: sAppno,
          Message: this.getBundleText('MSG_00040'),
          Max: 10,
          // FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
