registerPlugin({
    name: "Zod",
    version: "1.0.3 (Zod: 3.22.4)",
    description: "Zod library made to be used with(in) Sinusbot",
    author: "DrWarpMan <drwarpman@gmail.com>",
    backends: [ "ts3", "discord" ],
    engine: ">= 1.0",
    autorun: !0,
    enableWeb: !1,
    hidden: !1,
    requiredModules: [],
    voiceCommands: [],
    vars: []
}, (_, __, {
    name,
    version,
    author
}) => {
    const exports = {};
    var util;
    Object.defineProperties(exports, {
        __esModule: {
            value: !0
        },
        [Symbol.toStringTag]: {
            value: "Module"
        }
    }), exports.util = void 0, (util = exports.util || (exports.util = {})).assertEqual = val => val, 
    util.assertIs = function(_arg) {}, util.assertNever = function(_x) {
        throw new Error();
    }, util.arrayToEnum = items => {
        var obj = {};
        for (const item of items) obj[item] = item;
        return obj;
    }, util.getValidEnumValues = obj => {
        var validKeys = util.objectKeys(obj).filter(k => "number" != typeof obj[obj[k]]), filtered = {};
        for (const k of validKeys) filtered[k] = obj[k];
        return util.objectValues(filtered);
    }, util.objectValues = obj => util.objectKeys(obj).map(function(e) {
        return obj[e];
    }), util.objectKeys = "function" == typeof Object.keys ? obj => Object.keys(obj) // eslint-disable-line ban/ban
     : object => {
        var keys = [];
        for (const key in object) Object.prototype.hasOwnProperty.call(object, key) && keys.push(key);
        return keys;
    }, util.find = (arr, checker) => {
        for (const item of arr) if (checker(item)) return item;
    }, util.isInteger = "function" == typeof Number.isInteger ? val => Number.isInteger(val) // eslint-disable-line ban/ban
     : val => "number" == typeof val && isFinite(val) && Math.floor(val) === val, 
    util.joinValues = function(array, separator = " | ") {
        return array.map(val => "string" == typeof val ? `'${val}'` : val).join(separator);
    }, util.jsonStringifyReplacer = (_, value) => "bigint" == typeof value ? value.toString() : value, 
    exports.objectUtil = void 0, (exports.objectUtil || (exports.objectUtil = {})).mergeShapes = (first, second) => ({
        ...first,
        ...second
    });
    const ZodParsedType = exports.util.arrayToEnum([ "string", "nan", "number", "integer", "float", "boolean", "date", "bigint", "symbol", "function", "undefined", "null", "array", "object", "unknown", "promise", "void", "never", "map", "set" ]), getParsedType = data => {
        switch (typeof data) {
          case "undefined":
            return ZodParsedType.undefined;

          case "string":
            return ZodParsedType.string;

          case "number":
            return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;

          case "boolean":
            return ZodParsedType.boolean;

          case "function":
            return ZodParsedType.function;

          case "bigint":
            return ZodParsedType.bigint;

          case "symbol":
            return ZodParsedType.symbol;

          case "object":
            return Array.isArray(data) ? ZodParsedType.array : null === data ? ZodParsedType.null : data.then && "function" == typeof data.then && data.catch && "function" == typeof data.catch ? ZodParsedType.promise : "undefined" != typeof Map && data instanceof Map ? ZodParsedType.map : "undefined" != typeof Set && data instanceof Set ? ZodParsedType.set : "undefined" != typeof Date && data instanceof Date ? ZodParsedType.date : ZodParsedType.object;

          default:
            return ZodParsedType.unknown;
        }
    }, ZodIssueCode = exports.util.arrayToEnum([ "invalid_type", "invalid_literal", "custom", "invalid_union", "invalid_union_discriminator", "invalid_enum_value", "unrecognized_keys", "invalid_arguments", "invalid_return_type", "invalid_date", "invalid_string", "too_small", "too_big", "invalid_intersection_types", "not_multiple_of", "not_finite" ]);
    var quotelessJson = obj => {
        return JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, "$1:");
    };
    class ZodError extends Error {
        constructor(issues) {
            super(), this.issues = [], this.addIssue = sub => {
                this.issues = [ ...this.issues, sub ];
            }, this.addIssues = (subs = []) => {
                this.issues = [ ...this.issues, ...subs ];
            };
            var actualProto = new.target.prototype;
            Object.setPrototypeOf ? 
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto) : this.__proto__ = actualProto, 
            this.name = "ZodError", this.issues = issues;
        }
        get errors() {
            return this.issues;
        }
        format(_mapper) {
            const mapper = _mapper || function(issue) {
                return issue.message;
            }, fieldErrors = {
                _errors: []
            }, processError = error => {
                for (const issue of error.issues) if ("invalid_union" === issue.code) issue.unionErrors.map(processError); else if ("invalid_return_type" === issue.code) processError(issue.returnTypeError); else if ("invalid_arguments" === issue.code) processError(issue.argumentsError); else if (0 === issue.path.length) fieldErrors._errors.push(mapper(issue)); else {
                    let curr = fieldErrors, i = 0;
                    for (;i < issue.path.length; ) {
                        var el = issue.path[i];
                        i === issue.path.length - 1 ? (curr[el] = curr[el] || {
                            _errors: []
                        }, curr[el]._errors.push(mapper(issue))) : curr[el] = curr[el] || {
                            _errors: []
                        }, curr = curr[el], i++;
                    }
                }
            };
            return processError(this), fieldErrors;
        }
        toString() {
            return this.message;
        }
        get message() {
            return JSON.stringify(this.issues, exports.util.jsonStringifyReplacer, 2);
        }
        get isEmpty() {
            return 0 === this.issues.length;
        }
        flatten(mapper = issue => issue.message) {
            var fieldErrors = {}, formErrors = [];
            for (const sub of this.issues) (0 < sub.path.length ? (fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [], 
            fieldErrors[sub.path[0]]) : formErrors).push(mapper(sub));
            return {
                formErrors: formErrors,
                fieldErrors: fieldErrors
            };
        }
        get formErrors() {
            return this.flatten();
        }
    }
    ZodError.create = issues => {
        return new ZodError(issues);
    };
    const errorMap = (issue, _ctx) => {
        let message;
        switch (issue.code) {
          case ZodIssueCode.invalid_type:
            message = issue.received === ZodParsedType.undefined ? "Required" : `Expected ${issue.expected}, received ` + issue.received;
            break;

          case ZodIssueCode.invalid_literal:
            message = "Invalid literal value, expected " + JSON.stringify(issue.expected, exports.util.jsonStringifyReplacer);
            break;

          case ZodIssueCode.unrecognized_keys:
            message = "Unrecognized key(s) in object: " + exports.util.joinValues(issue.keys, ", ");
            break;

          case ZodIssueCode.invalid_union:
            message = "Invalid input";
            break;

          case ZodIssueCode.invalid_union_discriminator:
            message = "Invalid discriminator value. Expected " + exports.util.joinValues(issue.options);
            break;

          case ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${exports.util.joinValues(issue.options)}, received '${issue.received}'`;
            break;

          case ZodIssueCode.invalid_arguments:
            message = "Invalid function arguments";
            break;

          case ZodIssueCode.invalid_return_type:
            message = "Invalid function return type";
            break;

          case ZodIssueCode.invalid_date:
            message = "Invalid date";
            break;

          case ZodIssueCode.invalid_string:
            "object" == typeof issue.validation ? "includes" in issue.validation ? (message = `Invalid input: must include "${issue.validation.includes}"`, 
            "number" == typeof issue.validation.position && (message = message + " at one or more positions greater than or equal to " + issue.validation.position)) : "startsWith" in issue.validation ? message = `Invalid input: must start with "${issue.validation.startsWith}"` : "endsWith" in issue.validation ? message = `Invalid input: must end with "${issue.validation.endsWith}"` : exports.util.assertNever(issue.validation) : message = "regex" !== issue.validation ? "Invalid " + issue.validation : "Invalid";
            break;

          case ZodIssueCode.too_small:
            message = "array" === issue.type ? `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "more than"} ${issue.minimum} element(s)` : "string" === issue.type ? `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "over"} ${issue.minimum} character(s)` : "number" === issue.type ? "Number must be " + (issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than ") + issue.minimum : "date" === issue.type ? "Date must be " + (issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than ") + new Date(Number(issue.minimum)) : "Invalid input";
            break;

          case ZodIssueCode.too_big:
            message = "array" === issue.type ? `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "less than"} ${issue.maximum} element(s)` : "string" === issue.type ? `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "under"} ${issue.maximum} character(s)` : "number" === issue.type ? `Number must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ` + issue.maximum : "bigint" === issue.type ? `BigInt must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ` + issue.maximum : "date" === issue.type ? `Date must be ${issue.exact ? "exactly" : issue.inclusive ? "smaller than or equal to" : "smaller than"} ` + new Date(Number(issue.maximum)) : "Invalid input";
            break;

          case ZodIssueCode.custom:
            message = "Invalid input";
            break;

          case ZodIssueCode.invalid_intersection_types:
            message = "Intersection results could not be merged";
            break;

          case ZodIssueCode.not_multiple_of:
            message = "Number must be a multiple of " + issue.multipleOf;
            break;

          case ZodIssueCode.not_finite:
            message = "Number must be finite";
            break;

          default:
            message = _ctx.defaultError, exports.util.assertNever(issue);
        }
        return {
            message: message
        };
    };
    let overrideErrorMap = errorMap;
    function setErrorMap(map) {
        overrideErrorMap = map;
    }
    function getErrorMap() {
        return overrideErrorMap;
    }
    const makeIssue = params => {
        var {
            data,
            path: params,
            errorMaps,
            issueData
        } = params, params = [ ...params, ...issueData.path || [] ], fullIssue = {
            ...issueData,
            path: params
        };
        let errorMessage = "";
        for (const map of errorMaps.filter(m => !!m).slice().reverse()) errorMessage = map(fullIssue, {
            data: data,
            defaultError: errorMessage
        }).message;
        return {
            ...issueData,
            path: params,
            message: issueData.message || errorMessage
        };
    };
    var errorUtil, EMPTY_PATH = [];
    function addIssueToContext(ctx, issueData) {
        issueData = makeIssue({
            issueData: issueData,
            data: ctx.data,
            path: ctx.path,
            errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap ].filter(x => !!x)
        });
        ctx.common.issues.push(issueData);
    }
    class ParseStatus {
        constructor() {
            this.value = "valid";
        }
        dirty() {
            "valid" === this.value && (this.value = "dirty");
        }
        abort() {
            "aborted" !== this.value && (this.value = "aborted");
        }
        static mergeArray(status, results) {
            var arrayValue = [];
            for (const s of results) {
                if ("aborted" === s.status) return INVALID;
                "dirty" === s.status && status.dirty(), arrayValue.push(s.value);
            }
            return {
                status: status.value,
                value: arrayValue
            };
        }
        static async mergeObjectAsync(status, pairs) {
            var syncPairs = [];
            for (const pair of pairs) syncPairs.push({
                key: await pair.key,
                value: await pair.value
            });
            return ParseStatus.mergeObjectSync(status, syncPairs);
        }
        static mergeObjectSync(status, pairs) {
            var finalObject = {};
            for (const pair of pairs) {
                var {
                    key,
                    value
                } = pair;
                if ("aborted" === key.status) return INVALID;
                if ("aborted" === value.status) return INVALID;
                "dirty" === key.status && status.dirty(), "dirty" === value.status && status.dirty(), 
                "__proto__" === key.value || void 0 === value.value && !pair.alwaysSet || (finalObject[key.value] = value.value);
            }
            return {
                status: status.value,
                value: finalObject
            };
        }
    }
    const INVALID = Object.freeze({
        status: "aborted"
    }), DIRTY = value => ({
        status: "dirty",
        value: value
    }), OK = value => ({
        status: "valid",
        value: value
    }), isAborted = x => "aborted" === x.status, isDirty = x => "dirty" === x.status, isValid = x => "valid" === x.status, isAsync = x => "undefined" != typeof Promise && x instanceof Promise;
    !function(errorUtil) {
        errorUtil.errToObj = message => "string" == typeof message ? {
            message: message
        } : message || {}, errorUtil.toString = message => "string" == typeof message ? message : null == message ? void 0 : message.message;
    }(errorUtil = errorUtil || {});
    class ParseInputLazyPath {
        constructor(parent, value, path, key) {
            this._cachedPath = [], this.parent = parent, this.data = value, this._path = path, 
            this._key = key;
        }
        get path() {
            return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), 
            this._cachedPath;
        }
    }
    const handleResult = (ctx, result) => {
        if (isValid(result)) return {
            success: !0,
            data: result.value
        };
        if (ctx.common.issues.length) return {
            success: !1,
            get error() {
                var error;
                return this._error || (error = new ZodError(ctx.common.issues), 
                this._error = error), this._error;
            }
        };
        throw new Error("Validation failed but no issues detected.");
    };
    function processCreateParams(params) {
        if (!params) return {};
        const {
            errorMap,
            invalid_type_error,
            required_error,
            description
        } = params;
        if (errorMap && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
        return errorMap ? {
            errorMap: errorMap,
            description: description
        } : {
            errorMap: (iss, ctx) => "invalid_type" !== iss.code ? {
                message: ctx.defaultError
            } : void 0 === ctx.data ? {
                message: null !== required_error && void 0 !== required_error ? required_error : ctx.defaultError
            } : {
                message: null !== invalid_type_error && void 0 !== invalid_type_error ? invalid_type_error : ctx.defaultError
            },
            description: description
        };
    }
    class ZodType {
        constructor(def) {
            /** Alias of safeParseAsync */
            this.spa = this.safeParseAsync, this._def = def, this.parse = this.parse.bind(this), 
            this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), 
            this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), 
            this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), 
            this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), 
            this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), 
            this.array = this.array.bind(this), this.promise = this.promise.bind(this), 
            this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), 
            this.brand = this.brand.bind(this), this.default = this.default.bind(this), 
            this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), 
            this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), 
            this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this);
        }
        get description() {
            return this._def.description;
        }
        _getType(input) {
            return getParsedType(input.data);
        }
        _getOrReturnCtx(input, ctx) {
            return ctx || {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent
            };
        }
        _processInputParams(input) {
            return {
                status: new ParseStatus(),
                ctx: {
                    common: input.parent.common,
                    data: input.data,
                    parsedType: getParsedType(input.data),
                    schemaErrorMap: this._def.errorMap,
                    path: input.path,
                    parent: input.parent
                }
            };
        }
        _parseSync(input) {
            input = this._parse(input);
            if (isAsync(input)) throw new Error("Synchronous parse encountered promise.");
            return input;
        }
        _parseAsync(input) {
            input = this._parse(input);
            return Promise.resolve(input);
        }
        parse(data, params) {
            data = this.safeParse(data, params);
            if (data.success) return data.data;
            throw data.error;
        }
        safeParse(data, params) {
            var _a = {
                common: {
                    issues: [],
                    async: null != (_a = null == params ? void 0 : params.async) && _a,
                    contextualErrorMap: null == params ? void 0 : params.errorMap
                },
                path: (null == params ? void 0 : params.path) || [],
                schemaErrorMap: this._def.errorMap,
                parent: null,
                data: data,
                parsedType: getParsedType(data)
            }, params = this._parseSync({
                data: data,
                path: _a.path,
                parent: _a
            });
            return handleResult(_a, params);
        }
        async parseAsync(data, params) {
            data = await this.safeParseAsync(data, params);
            if (data.success) return data.data;
            throw data.error;
        }
        async safeParseAsync(data, params) {
            params = {
                common: {
                    issues: [],
                    contextualErrorMap: null == params ? void 0 : params.errorMap,
                    async: !0
                },
                path: (null == params ? void 0 : params.path) || [],
                schemaErrorMap: this._def.errorMap,
                parent: null,
                data: data,
                parsedType: getParsedType(data)
            }, data = this._parse({
                data: data,
                path: params.path,
                parent: params
            }), data = await (isAsync(data) ? data : Promise.resolve(data));
            return handleResult(params, data);
        }
        refine(check, message) {
            return this._refinement((val, ctx) => {
                var result = check(val);
                const setError = () => ctx.addIssue({
                    code: ZodIssueCode.custom,
                    ...(val => "string" == typeof message || void 0 === message ? {
                        message: message
                    } : "function" == typeof message ? message(val) : message)(val)
                });
                return "undefined" != typeof Promise && result instanceof Promise ? result.then(data => !!data || (setError(), 
                !1)) : !!result || (setError(), !1);
            });
        }
        refinement(check, refinementData) {
            return this._refinement((val, ctx) => !!check(val) || (ctx.addIssue("function" == typeof refinementData ? refinementData(val, ctx) : refinementData), 
            !1));
        }
        _refinement(refinement) {
            return new ZodEffects({
                schema: this,
                typeName: exports.ZodFirstPartyTypeKind.ZodEffects,
                effect: {
                    type: "refinement",
                    refinement: refinement
                }
            });
        }
        superRefine(refinement) {
            return this._refinement(refinement);
        }
        optional() {
            return ZodOptional.create(this, this._def);
        }
        nullable() {
            return ZodNullable.create(this, this._def);
        }
        nullish() {
            return this.nullable().optional();
        }
        array() {
            return ZodArray.create(this, this._def);
        }
        promise() {
            return ZodPromise.create(this, this._def);
        }
        or(option) {
            return ZodUnion.create([ this, option ], this._def);
        }
        and(incoming) {
            return ZodIntersection.create(this, incoming, this._def);
        }
        transform(transform) {
            return new ZodEffects({
                ...processCreateParams(this._def),
                schema: this,
                typeName: exports.ZodFirstPartyTypeKind.ZodEffects,
                effect: {
                    type: "transform",
                    transform: transform
                }
            });
        }
        default(def) {
            var defaultValueFunc = "function" == typeof def ? def : () => def;
            return new ZodDefault({
                ...processCreateParams(this._def),
                innerType: this,
                defaultValue: defaultValueFunc,
                typeName: exports.ZodFirstPartyTypeKind.ZodDefault
            });
        }
        brand() {
            return new ZodBranded({
                typeName: exports.ZodFirstPartyTypeKind.ZodBranded,
                type: this,
                ...processCreateParams(this._def)
            });
        }
        catch(def) {
            var catchValueFunc = "function" == typeof def ? def : () => def;
            return new ZodCatch({
                ...processCreateParams(this._def),
                innerType: this,
                catchValue: catchValueFunc,
                typeName: exports.ZodFirstPartyTypeKind.ZodCatch
            });
        }
        describe(description) {
            return new this.constructor({
                ...this._def,
                description: description
            });
        }
        pipe(target) {
            return ZodPipeline.create(this, target);
        }
        readonly() {
            return ZodReadonly.create(this);
        }
        isOptional() {
            return this.safeParse(void 0).success;
        }
        isNullable() {
            return this.safeParse(null).success;
        }
    }
    const cuidRegex = /^c[^\s-]{8,}$/i, cuid2Regex = /^[a-z][a-z0-9]*$/, ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/, uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_+-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    let emojiRegex;
    const ipv4Regex = /^(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))$/, ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/, datetimeRegex = args => args.precision ? args.offset ? new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}(([+-]\\d{2}(:?\\d{2})?)|Z)$`) : new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}Z$`) : 0 === args.precision ? args.offset ? new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(([+-]\\d{2}(:?\\d{2})?)|Z)$") : new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$") : args.offset ? new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(([+-]\\d{2}(:?\\d{2})?)|Z)$") : new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$");
    function isValidIP(ip, version) {
        return ("v4" === version || !version) && ipv4Regex.test(ip) || !("v6" !== version && version || !ipv6Regex.test(ip));
    }
    class ZodString extends ZodType {
        _parse(input) {
            if (this._def.coerce && (input.data = String(input.data)), this._getType(input) !== ZodParsedType.string) {
                const ctx = this._getOrReturnCtx(input);
                return addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.string,
                    received: ctx.parsedType
                }), INVALID;
            }
            var status = new ParseStatus();
            let ctx = void 0;
            for (const check of this._def.checks) if ("min" === check.kind) input.data.length < check.value && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: !0,
                exact: !1,
                message: check.message
            }), status.dirty()); else if ("max" === check.kind) input.data.length > check.value && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: !0,
                exact: !1,
                message: check.message
            }), status.dirty()); else if ("length" === check.kind) {
                var tooBig = input.data.length > check.value, tooSmall = input.data.length < check.value;
                (tooBig || tooSmall) && (ctx = this._getOrReturnCtx(input, ctx), 
                tooBig ? addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: check.value,
                    type: "string",
                    inclusive: !0,
                    exact: !0,
                    message: check.message
                }) : tooSmall && addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: check.value,
                    type: "string",
                    inclusive: !0,
                    exact: !0,
                    message: check.message
                }), status.dirty());
            } else if ("email" === check.kind) emailRegex.test(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                validation: "email",
                code: ZodIssueCode.invalid_string,
                message: check.message
            }), status.dirty()); else if ("emoji" === check.kind) (emojiRegex = emojiRegex || new RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u")).test(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                validation: "emoji",
                code: ZodIssueCode.invalid_string,
                message: check.message
            }), status.dirty()); else if ("uuid" === check.kind) uuidRegex.test(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                validation: "uuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
            }), status.dirty()); else if ("cuid" === check.kind) cuidRegex.test(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                validation: "cuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
            }), status.dirty()); else if ("cuid2" === check.kind) cuid2Regex.test(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                validation: "cuid2",
                code: ZodIssueCode.invalid_string,
                message: check.message
            }), status.dirty()); else if ("ulid" === check.kind) ulidRegex.test(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                validation: "ulid",
                code: ZodIssueCode.invalid_string,
                message: check.message
            }), status.dirty()); else if ("url" === check.kind) try {
                new URL(input.data);
            } catch (_a) {
                addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                    validation: "url",
                    code: ZodIssueCode.invalid_string,
                    message: check.message
                }), status.dirty();
            } else "regex" === check.kind ? (check.regex.lastIndex = 0, check.regex.test(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                validation: "regex",
                code: ZodIssueCode.invalid_string,
                message: check.message
            }), status.dirty())) : "trim" === check.kind ? input.data = input.data.trim() : "includes" === check.kind ? input.data.includes(check.value, check.position) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.invalid_string,
                validation: {
                    includes: check.value,
                    position: check.position
                },
                message: check.message
            }), status.dirty()) : "toLowerCase" === check.kind ? input.data = input.data.toLowerCase() : "toUpperCase" === check.kind ? input.data = input.data.toUpperCase() : "startsWith" === check.kind ? input.data.startsWith(check.value) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.invalid_string,
                validation: {
                    startsWith: check.value
                },
                message: check.message
            }), status.dirty()) : "endsWith" === check.kind ? input.data.endsWith(check.value) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.invalid_string,
                validation: {
                    endsWith: check.value
                },
                message: check.message
            }), status.dirty()) : "datetime" === check.kind ? datetimeRegex(check).test(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.invalid_string,
                validation: "datetime",
                message: check.message
            }), status.dirty()) : "ip" === check.kind ? isValidIP(input.data, check.version) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                validation: "ip",
                code: ZodIssueCode.invalid_string,
                message: check.message
            }), status.dirty()) : exports.util.assertNever(check);
            return {
                status: status.value,
                value: input.data
            };
        }
        _regex(regex, validation, message) {
            return this.refinement(data => regex.test(data), {
                validation: validation,
                code: ZodIssueCode.invalid_string,
                ...errorUtil.errToObj(message)
            });
        }
        _addCheck(check) {
            return new ZodString({
                ...this._def,
                checks: [ ...this._def.checks, check ]
            });
        }
        email(message) {
            return this._addCheck({
                kind: "email",
                ...errorUtil.errToObj(message)
            });
        }
        url(message) {
            return this._addCheck({
                kind: "url",
                ...errorUtil.errToObj(message)
            });
        }
        emoji(message) {
            return this._addCheck({
                kind: "emoji",
                ...errorUtil.errToObj(message)
            });
        }
        uuid(message) {
            return this._addCheck({
                kind: "uuid",
                ...errorUtil.errToObj(message)
            });
        }
        cuid(message) {
            return this._addCheck({
                kind: "cuid",
                ...errorUtil.errToObj(message)
            });
        }
        cuid2(message) {
            return this._addCheck({
                kind: "cuid2",
                ...errorUtil.errToObj(message)
            });
        }
        ulid(message) {
            return this._addCheck({
                kind: "ulid",
                ...errorUtil.errToObj(message)
            });
        }
        ip(options) {
            return this._addCheck({
                kind: "ip",
                ...errorUtil.errToObj(options)
            });
        }
        datetime(options) {
            var _a;
            return "string" == typeof options ? this._addCheck({
                kind: "datetime",
                precision: null,
                offset: !1,
                message: options
            }) : this._addCheck({
                kind: "datetime",
                precision: void 0 === (null == options ? void 0 : options.precision) ? null : null == options ? void 0 : options.precision,
                offset: null != (_a = null == options ? void 0 : options.offset) && _a,
                ...errorUtil.errToObj(null == options ? void 0 : options.message)
            });
        }
        regex(regex, message) {
            return this._addCheck({
                kind: "regex",
                regex: regex,
                ...errorUtil.errToObj(message)
            });
        }
        includes(value, options) {
            return this._addCheck({
                kind: "includes",
                value: value,
                position: null == options ? void 0 : options.position,
                ...errorUtil.errToObj(null == options ? void 0 : options.message)
            });
        }
        startsWith(value, message) {
            return this._addCheck({
                kind: "startsWith",
                value: value,
                ...errorUtil.errToObj(message)
            });
        }
        endsWith(value, message) {
            return this._addCheck({
                kind: "endsWith",
                value: value,
                ...errorUtil.errToObj(message)
            });
        }
        min(minLength, message) {
            return this._addCheck({
                kind: "min",
                value: minLength,
                ...errorUtil.errToObj(message)
            });
        }
        max(maxLength, message) {
            return this._addCheck({
                kind: "max",
                value: maxLength,
                ...errorUtil.errToObj(message)
            });
        }
        length(len, message) {
            return this._addCheck({
                kind: "length",
                value: len,
                ...errorUtil.errToObj(message)
            });
        }
        /**
     * @deprecated Use z.string().min(1) instead.
     * @see {@link ZodString.min}
     */
        nonempty(message) {
            return this.min(1, errorUtil.errToObj(message));
        }
        trim() {
            return new ZodString({
                ...this._def,
                checks: [ ...this._def.checks, {
                    kind: "trim"
                } ]
            });
        }
        toLowerCase() {
            return new ZodString({
                ...this._def,
                checks: [ ...this._def.checks, {
                    kind: "toLowerCase"
                } ]
            });
        }
        toUpperCase() {
            return new ZodString({
                ...this._def,
                checks: [ ...this._def.checks, {
                    kind: "toUpperCase"
                } ]
            });
        }
        get isDatetime() {
            return !!this._def.checks.find(ch => "datetime" === ch.kind);
        }
        get isEmail() {
            return !!this._def.checks.find(ch => "email" === ch.kind);
        }
        get isURL() {
            return !!this._def.checks.find(ch => "url" === ch.kind);
        }
        get isEmoji() {
            return !!this._def.checks.find(ch => "emoji" === ch.kind);
        }
        get isUUID() {
            return !!this._def.checks.find(ch => "uuid" === ch.kind);
        }
        get isCUID() {
            return !!this._def.checks.find(ch => "cuid" === ch.kind);
        }
        get isCUID2() {
            return !!this._def.checks.find(ch => "cuid2" === ch.kind);
        }
        get isULID() {
            return !!this._def.checks.find(ch => "ulid" === ch.kind);
        }
        get isIP() {
            return !!this._def.checks.find(ch => "ip" === ch.kind);
        }
        get minLength() {
            let min = null;
            for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
            return min;
        }
        get maxLength() {
            let max = null;
            for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
            return max;
        }
    }
    // https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
    function floatSafeRemainder(val, step) {
        var valDecCount = (val.toString().split(".")[1] || "").length, stepDecCount = (step.toString().split(".")[1] || "").length, valDecCount = stepDecCount < valDecCount ? valDecCount : stepDecCount;
        return parseInt(val.toFixed(valDecCount).replace(".", "")) % parseInt(step.toFixed(valDecCount).replace(".", "")) / Math.pow(10, valDecCount);
    }
    ZodString.create = params => {
        var _a;
        return new ZodString({
            checks: [],
            typeName: exports.ZodFirstPartyTypeKind.ZodString,
            coerce: null != (_a = null == params ? void 0 : params.coerce) && _a,
            ...processCreateParams(params)
        });
    };
    class ZodNumber extends ZodType {
        constructor() {
            super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
        }
        _parse(input) {
            if (this._def.coerce && (input.data = Number(input.data)), this._getType(input) !== ZodParsedType.number) {
                const ctx = this._getOrReturnCtx(input);
                return addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.number,
                    received: ctx.parsedType
                }), INVALID;
            }
            let ctx = void 0;
            var status = new ParseStatus();
            for (const check of this._def.checks) "int" === check.kind ? exports.util.isInteger(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.invalid_type,
                expected: "integer",
                received: "float",
                message: check.message
            }), status.dirty()) : "min" === check.kind ? (check.inclusive ? input.data < check.value : input.data <= check.value) && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: !1,
                message: check.message
            }), status.dirty()) : "max" === check.kind ? (check.inclusive ? input.data > check.value : input.data >= check.value) && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: !1,
                message: check.message
            }), status.dirty()) : "multipleOf" === check.kind ? 0 !== floatSafeRemainder(input.data, check.value) && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
            }), status.dirty()) : "finite" === check.kind ? Number.isFinite(input.data) || (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.not_finite,
                message: check.message
            }), status.dirty()) : exports.util.assertNever(check);
            return {
                status: status.value,
                value: input.data
            };
        }
        gte(value, message) {
            return this.setLimit("min", value, !0, errorUtil.toString(message));
        }
        gt(value, message) {
            return this.setLimit("min", value, !1, errorUtil.toString(message));
        }
        lte(value, message) {
            return this.setLimit("max", value, !0, errorUtil.toString(message));
        }
        lt(value, message) {
            return this.setLimit("max", value, !1, errorUtil.toString(message));
        }
        setLimit(kind, value, inclusive, message) {
            return new ZodNumber({
                ...this._def,
                checks: [ ...this._def.checks, {
                    kind: kind,
                    value: value,
                    inclusive: inclusive,
                    message: errorUtil.toString(message)
                } ]
            });
        }
        _addCheck(check) {
            return new ZodNumber({
                ...this._def,
                checks: [ ...this._def.checks, check ]
            });
        }
        int(message) {
            return this._addCheck({
                kind: "int",
                message: errorUtil.toString(message)
            });
        }
        positive(message) {
            return this._addCheck({
                kind: "min",
                value: 0,
                inclusive: !1,
                message: errorUtil.toString(message)
            });
        }
        negative(message) {
            return this._addCheck({
                kind: "max",
                value: 0,
                inclusive: !1,
                message: errorUtil.toString(message)
            });
        }
        nonpositive(message) {
            return this._addCheck({
                kind: "max",
                value: 0,
                inclusive: !0,
                message: errorUtil.toString(message)
            });
        }
        nonnegative(message) {
            return this._addCheck({
                kind: "min",
                value: 0,
                inclusive: !0,
                message: errorUtil.toString(message)
            });
        }
        multipleOf(value, message) {
            return this._addCheck({
                kind: "multipleOf",
                value: value,
                message: errorUtil.toString(message)
            });
        }
        finite(message) {
            return this._addCheck({
                kind: "finite",
                message: errorUtil.toString(message)
            });
        }
        safe(message) {
            return this._addCheck({
                kind: "min",
                inclusive: !0,
                value: Number.MIN_SAFE_INTEGER,
                message: errorUtil.toString(message)
            })._addCheck({
                kind: "max",
                inclusive: !0,
                value: Number.MAX_SAFE_INTEGER,
                message: errorUtil.toString(message)
            });
        }
        get minValue() {
            let min = null;
            for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
            return min;
        }
        get maxValue() {
            let max = null;
            for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
            return max;
        }
        get isInt() {
            return !!this._def.checks.find(ch => "int" === ch.kind || "multipleOf" === ch.kind && exports.util.isInteger(ch.value));
        }
        get isFinite() {
            let max = null, min = null;
            for (const ch of this._def.checks) {
                if ("finite" === ch.kind || "int" === ch.kind || "multipleOf" === ch.kind) return !0;
                "min" === ch.kind ? (null === min || ch.value > min) && (min = ch.value) : "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
            }
            return Number.isFinite(min) && Number.isFinite(max);
        }
    }
    ZodNumber.create = params => new ZodNumber({
        checks: [],
        typeName: exports.ZodFirstPartyTypeKind.ZodNumber,
        coerce: (null == params ? void 0 : params.coerce) || !1,
        ...processCreateParams(params)
    });
    class ZodBigInt extends ZodType {
        constructor() {
            super(...arguments), this.min = this.gte, this.max = this.lte;
        }
        _parse(input) {
            if (this._def.coerce && (input.data = BigInt(input.data)), this._getType(input) !== ZodParsedType.bigint) {
                const ctx = this._getOrReturnCtx(input);
                return addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.bigint,
                    received: ctx.parsedType
                }), INVALID;
            }
            let ctx = void 0;
            var status = new ParseStatus();
            for (const check of this._def.checks) "min" === check.kind ? (check.inclusive ? input.data < check.value : input.data <= check.value) && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.too_small,
                type: "bigint",
                minimum: check.value,
                inclusive: check.inclusive,
                message: check.message
            }), status.dirty()) : "max" === check.kind ? (check.inclusive ? input.data > check.value : input.data >= check.value) && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.too_big,
                type: "bigint",
                maximum: check.value,
                inclusive: check.inclusive,
                message: check.message
            }), status.dirty()) : "multipleOf" === check.kind ? input.data % check.value !== BigInt(0) && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
            }), status.dirty()) : exports.util.assertNever(check);
            return {
                status: status.value,
                value: input.data
            };
        }
        gte(value, message) {
            return this.setLimit("min", value, !0, errorUtil.toString(message));
        }
        gt(value, message) {
            return this.setLimit("min", value, !1, errorUtil.toString(message));
        }
        lte(value, message) {
            return this.setLimit("max", value, !0, errorUtil.toString(message));
        }
        lt(value, message) {
            return this.setLimit("max", value, !1, errorUtil.toString(message));
        }
        setLimit(kind, value, inclusive, message) {
            return new ZodBigInt({
                ...this._def,
                checks: [ ...this._def.checks, {
                    kind: kind,
                    value: value,
                    inclusive: inclusive,
                    message: errorUtil.toString(message)
                } ]
            });
        }
        _addCheck(check) {
            return new ZodBigInt({
                ...this._def,
                checks: [ ...this._def.checks, check ]
            });
        }
        positive(message) {
            return this._addCheck({
                kind: "min",
                value: BigInt(0),
                inclusive: !1,
                message: errorUtil.toString(message)
            });
        }
        negative(message) {
            return this._addCheck({
                kind: "max",
                value: BigInt(0),
                inclusive: !1,
                message: errorUtil.toString(message)
            });
        }
        nonpositive(message) {
            return this._addCheck({
                kind: "max",
                value: BigInt(0),
                inclusive: !0,
                message: errorUtil.toString(message)
            });
        }
        nonnegative(message) {
            return this._addCheck({
                kind: "min",
                value: BigInt(0),
                inclusive: !0,
                message: errorUtil.toString(message)
            });
        }
        multipleOf(value, message) {
            return this._addCheck({
                kind: "multipleOf",
                value: value,
                message: errorUtil.toString(message)
            });
        }
        get minValue() {
            let min = null;
            for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
            return min;
        }
        get maxValue() {
            let max = null;
            for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
            return max;
        }
    }
    ZodBigInt.create = params => {
        var _a;
        return new ZodBigInt({
            checks: [],
            typeName: exports.ZodFirstPartyTypeKind.ZodBigInt,
            coerce: null != (_a = null == params ? void 0 : params.coerce) && _a,
            ...processCreateParams(params)
        });
    };
    class ZodBoolean extends ZodType {
        _parse(input) {
            var ctx;
            return this._def.coerce && (input.data = Boolean(input.data)), this._getType(input) !== ZodParsedType.boolean ? (addIssueToContext(ctx = this._getOrReturnCtx(input), {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.boolean,
                received: ctx.parsedType
            }), INVALID) : OK(input.data);
        }
    }
    ZodBoolean.create = params => new ZodBoolean({
        typeName: exports.ZodFirstPartyTypeKind.ZodBoolean,
        coerce: (null == params ? void 0 : params.coerce) || !1,
        ...processCreateParams(params)
    });
    class ZodDate extends ZodType {
        _parse(input) {
            if (this._def.coerce && (input.data = new Date(input.data)), this._getType(input) !== ZodParsedType.date) {
                const ctx = this._getOrReturnCtx(input);
                return addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.date,
                    received: ctx.parsedType
                }), INVALID;
            }
            if (isNaN(input.data.getTime())) {
                const ctx = this._getOrReturnCtx(input);
                return addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_date
                }), INVALID;
            }
            var status = new ParseStatus();
            let ctx = void 0;
            for (const check of this._def.checks) "min" === check.kind ? input.data.getTime() < check.value && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.too_small,
                message: check.message,
                inclusive: !0,
                exact: !1,
                minimum: check.value,
                type: "date"
            }), status.dirty()) : "max" === check.kind ? input.data.getTime() > check.value && (addIssueToContext(ctx = this._getOrReturnCtx(input, ctx), {
                code: ZodIssueCode.too_big,
                message: check.message,
                inclusive: !0,
                exact: !1,
                maximum: check.value,
                type: "date"
            }), status.dirty()) : exports.util.assertNever(check);
            return {
                status: status.value,
                value: new Date(input.data.getTime())
            };
        }
        _addCheck(check) {
            return new ZodDate({
                ...this._def,
                checks: [ ...this._def.checks, check ]
            });
        }
        min(minDate, message) {
            return this._addCheck({
                kind: "min",
                value: minDate.getTime(),
                message: errorUtil.toString(message)
            });
        }
        max(maxDate, message) {
            return this._addCheck({
                kind: "max",
                value: maxDate.getTime(),
                message: errorUtil.toString(message)
            });
        }
        get minDate() {
            let min = null;
            for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
            return null != min ? new Date(min) : null;
        }
        get maxDate() {
            let max = null;
            for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
            return null != max ? new Date(max) : null;
        }
    }
    ZodDate.create = params => new ZodDate({
        checks: [],
        coerce: (null == params ? void 0 : params.coerce) || !1,
        typeName: exports.ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params)
    });
    class ZodSymbol extends ZodType {
        _parse(input) {
            var ctx;
            return this._getType(input) !== ZodParsedType.symbol ? (addIssueToContext(ctx = this._getOrReturnCtx(input), {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.symbol,
                received: ctx.parsedType
            }), INVALID) : OK(input.data);
        }
    }
    ZodSymbol.create = params => new ZodSymbol({
        typeName: exports.ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params)
    });
    class ZodUndefined extends ZodType {
        _parse(input) {
            var ctx;
            return this._getType(input) !== ZodParsedType.undefined ? (addIssueToContext(ctx = this._getOrReturnCtx(input), {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.undefined,
                received: ctx.parsedType
            }), INVALID) : OK(input.data);
        }
    }
    ZodUndefined.create = params => new ZodUndefined({
        typeName: exports.ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params)
    });
    class ZodNull extends ZodType {
        _parse(input) {
            var ctx;
            return this._getType(input) !== ZodParsedType.null ? (addIssueToContext(ctx = this._getOrReturnCtx(input), {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.null,
                received: ctx.parsedType
            }), INVALID) : OK(input.data);
        }
    }
    ZodNull.create = params => new ZodNull({
        typeName: exports.ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params)
    });
    class ZodAny extends ZodType {
        constructor() {
            super(...arguments), 
            // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
            this._any = !0;
        }
        _parse(input) {
            return OK(input.data);
        }
    }
    ZodAny.create = params => new ZodAny({
        typeName: exports.ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params)
    });
    class ZodUnknown extends ZodType {
        constructor() {
            super(...arguments), 
            // required
            this._unknown = !0;
        }
        _parse(input) {
            return OK(input.data);
        }
    }
    ZodUnknown.create = params => new ZodUnknown({
        typeName: exports.ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params)
    });
    class ZodNever extends ZodType {
        _parse(input) {
            input = this._getOrReturnCtx(input);
            return addIssueToContext(input, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.never,
                received: input.parsedType
            }), INVALID;
        }
    }
    ZodNever.create = params => new ZodNever({
        typeName: exports.ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params)
    });
    class ZodVoid extends ZodType {
        _parse(input) {
            var ctx;
            return this._getType(input) !== ZodParsedType.undefined ? (addIssueToContext(ctx = this._getOrReturnCtx(input), {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.void,
                received: ctx.parsedType
            }), INVALID) : OK(input.data);
        }
    }
    ZodVoid.create = params => new ZodVoid({
        typeName: exports.ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params)
    });
    class ZodArray extends ZodType {
        _parse(input) {
            const {
                ctx,
                status
            } = this._processInputParams(input), def = this._def;
            var tooSmall;
            return ctx.parsedType !== ZodParsedType.array ? (addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType
            }), INVALID) : (null !== def.exactLength && (input = ctx.data.length > def.exactLength.value, 
            tooSmall = ctx.data.length < def.exactLength.value, input || tooSmall) && (addIssueToContext(ctx, {
                code: input ? ZodIssueCode.too_big : ZodIssueCode.too_small,
                minimum: tooSmall ? def.exactLength.value : void 0,
                maximum: input ? def.exactLength.value : void 0,
                type: "array",
                inclusive: !0,
                exact: !0,
                message: def.exactLength.message
            }), status.dirty()), null !== def.minLength && ctx.data.length < def.minLength.value && (addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: def.minLength.value,
                type: "array",
                inclusive: !0,
                exact: !1,
                message: def.minLength.message
            }), status.dirty()), null !== def.maxLength && ctx.data.length > def.maxLength.value && (addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: def.maxLength.value,
                type: "array",
                inclusive: !0,
                exact: !1,
                message: def.maxLength.message
            }), status.dirty()), ctx.common.async ? Promise.all([ ...ctx.data ].map((item, i) => def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i)))).then(result => ParseStatus.mergeArray(status, result)) : (tooSmall = [ ...ctx.data ].map((item, i) => def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i))), 
            ParseStatus.mergeArray(status, tooSmall)));
        }
        get element() {
            return this._def.type;
        }
        min(minLength, message) {
            return new ZodArray({
                ...this._def,
                minLength: {
                    value: minLength,
                    message: errorUtil.toString(message)
                }
            });
        }
        max(maxLength, message) {
            return new ZodArray({
                ...this._def,
                maxLength: {
                    value: maxLength,
                    message: errorUtil.toString(message)
                }
            });
        }
        length(len, message) {
            return new ZodArray({
                ...this._def,
                exactLength: {
                    value: len,
                    message: errorUtil.toString(message)
                }
            });
        }
        nonempty(message) {
            return this.min(1, message);
        }
    }
    function deepPartialify(schema) {
        if (schema instanceof ZodObject) {
            const newShape = {};
            for (const key in schema.shape) {
                var fieldSchema = schema.shape[key];
                newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
            }
            return new ZodObject({
                ...schema._def,
                shape: () => newShape
            });
        }
        return schema instanceof ZodArray ? new ZodArray({
            ...schema._def,
            type: deepPartialify(schema.element)
        }) : schema instanceof ZodOptional ? ZodOptional.create(deepPartialify(schema.unwrap())) : schema instanceof ZodNullable ? ZodNullable.create(deepPartialify(schema.unwrap())) : schema instanceof ZodTuple ? ZodTuple.create(schema.items.map(item => deepPartialify(item))) : schema;
    }
    ZodArray.create = (schema, params) => new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: exports.ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params)
    });
    class ZodObject extends ZodType {
        constructor() {
            super(...arguments), this._cached = null, 
            /**
         * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
         * If you want to pass through unknown properties, use `.passthrough()` instead.
         */
            this.nonstrict = this.passthrough, 
            // extend<
            //   Augmentation extends ZodRawShape,
            //   NewOutput extends util.flatten<{
            //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
            //       ? Augmentation[k]["_output"]
            //       : k extends keyof Output
            //       ? Output[k]
            //       : never;
            //   }>,
            //   NewInput extends util.flatten<{
            //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
            //       ? Augmentation[k]["_input"]
            //       : k extends keyof Input
            //       ? Input[k]
            //       : never;
            //   }>
            // >(
            //   augmentation: Augmentation
            // ): ZodObject<
            //   extendShape<T, Augmentation>,
            //   UnknownKeys,
            //   Catchall,
            //   NewOutput,
            //   NewInput
            // > {
            //   return new ZodObject({
            //     ...this._def,
            //     shape: () => ({
            //       ...this._def.shape(),
            //       ...augmentation,
            //     }),
            //   }) as any;
            // }
            /**
         * @deprecated Use `.extend` instead
         *  */
            this.augment = this.extend;
        }
        _getCached() {
            var shape, keys;
            return null !== this._cached ? this._cached : (shape = this._def.shape(), 
            keys = exports.util.objectKeys(shape), this._cached = {
                shape: shape,
                keys: keys
            });
        }
        _parse(input) {
            if (this._getType(input) !== ZodParsedType.object) {
                const ctx = this._getOrReturnCtx(input);
                return addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.object,
                    received: ctx.parsedType
                }), INVALID;
            }
            const {
                status,
                ctx
            } = this._processInputParams(input);
            var {
                shape,
                keys: shapeKeys
            } = this._getCached(), extraKeys = [];
            if (!(this._def.catchall instanceof ZodNever && "strip" === this._def.unknownKeys)) for (const key in ctx.data) shapeKeys.includes(key) || extraKeys.push(key);
            const pairs = [];
            for (const key of shapeKeys) {
                var keyValidator = shape[key], value = ctx.data[key];
                pairs.push({
                    key: {
                        status: "valid",
                        value: key
                    },
                    value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                    alwaysSet: key in ctx.data
                });
            }
            if (this._def.catchall instanceof ZodNever) {
                input = this._def.unknownKeys;
                if ("passthrough" === input) for (const key of extraKeys) pairs.push({
                    key: {
                        status: "valid",
                        value: key
                    },
                    value: {
                        status: "valid",
                        value: ctx.data[key]
                    }
                }); else if ("strict" === input) 0 < extraKeys.length && (addIssueToContext(ctx, {
                    code: ZodIssueCode.unrecognized_keys,
                    keys: extraKeys
                }), status.dirty()); else if ("strip" !== input) throw new Error("Internal ZodObject error: invalid unknownKeys value.");
            } else {
                // run catchall validation
                var catchall = this._def.catchall;
                for (const key of extraKeys) {
                    const value = ctx.data[key];
                    pairs.push({
                        key: {
                            status: "valid",
                            value: key
                        },
                        value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                        alwaysSet: key in ctx.data
                    });
                }
            }
            return ctx.common.async ? Promise.resolve().then(async () => {
                var syncPairs = [];
                for (const pair of pairs) {
                    var key = await pair.key;
                    syncPairs.push({
                        key: key,
                        value: await pair.value,
                        alwaysSet: pair.alwaysSet
                    });
                }
                return syncPairs;
            }).then(syncPairs => ParseStatus.mergeObjectSync(status, syncPairs)) : ParseStatus.mergeObjectSync(status, pairs);
        }
        get shape() {
            return this._def.shape();
        }
        strict(message) {
            return errorUtil.errToObj, new ZodObject({
                ...this._def,
                unknownKeys: "strict",
                ...void 0 !== message ? {
                    errorMap: (issue, ctx) => {
                        var _b, _a = null != (_b = null == (_b = (_a = this._def).errorMap) ? void 0 : _b.call(_a, issue, ctx).message) ? _b : ctx.defaultError;
                        return "unrecognized_keys" === issue.code ? {
                            message: null != (_b = errorUtil.errToObj(message).message) ? _b : _a
                        } : {
                            message: _a
                        };
                    }
                } : {}
            });
        }
        strip() {
            return new ZodObject({
                ...this._def,
                unknownKeys: "strip"
            });
        }
        passthrough() {
            return new ZodObject({
                ...this._def,
                unknownKeys: "passthrough"
            });
        }
        // const AugmentFactory =
        //   <Def extends ZodObjectDef>(def: Def) =>
        //   <Augmentation extends ZodRawShape>(
        //     augmentation: Augmentation
        //   ): ZodObject<
        //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
        //     Def["unknownKeys"],
        //     Def["catchall"]
        //   > => {
        //     return new ZodObject({
        //       ...def,
        //       shape: () => ({
        //         ...def.shape(),
        //         ...augmentation,
        //       }),
        //     }) as any;
        //   };
        extend(augmentation) {
            return new ZodObject({
                ...this._def,
                shape: () => ({
                    ...this._def.shape(),
                    ...augmentation
                })
            });
        }
        /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
        merge(merging) {
            return new ZodObject({
                unknownKeys: merging._def.unknownKeys,
                catchall: merging._def.catchall,
                shape: () => ({
                    ...this._def.shape(),
                    ...merging._def.shape()
                }),
                typeName: exports.ZodFirstPartyTypeKind.ZodObject
            });
        }
        // merge<
        //   Incoming extends AnyZodObject,
        //   Augmentation extends Incoming["shape"],
        //   NewOutput extends {
        //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
        //       ? Augmentation[k]["_output"]
        //       : k extends keyof Output
        //       ? Output[k]
        //       : never;
        //   },
        //   NewInput extends {
        //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
        //       ? Augmentation[k]["_input"]
        //       : k extends keyof Input
        //       ? Input[k]
        //       : never;
        //   }
        // >(
        //   merging: Incoming
        // ): ZodObject<
        //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
        //   Incoming["_def"]["unknownKeys"],
        //   Incoming["_def"]["catchall"],
        //   NewOutput,
        //   NewInput
        // > {
        //   const merged: any = new ZodObject({
        //     unknownKeys: merging._def.unknownKeys,
        //     catchall: merging._def.catchall,
        //     shape: () =>
        //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
        //     typeName: ZodFirstPartyTypeKind.ZodObject,
        //   }) as any;
        //   return merged;
        // }
        setKey(key, schema) {
            return this.augment({
                [key]: schema
            });
        }
        // merge<Incoming extends AnyZodObject>(
        //   merging: Incoming
        // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
        // ZodObject<
        //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
        //   Incoming["_def"]["unknownKeys"],
        //   Incoming["_def"]["catchall"]
        // > {
        //   // const mergedShape = objectUtil.mergeShapes(
        //   //   this._def.shape(),
        //   //   merging._def.shape()
        //   // );
        //   const merged: any = new ZodObject({
        //     unknownKeys: merging._def.unknownKeys,
        //     catchall: merging._def.catchall,
        //     shape: () =>
        //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
        //     typeName: ZodFirstPartyTypeKind.ZodObject,
        //   }) as any;
        //   return merged;
        // }
        catchall(index) {
            return new ZodObject({
                ...this._def,
                catchall: index
            });
        }
        pick(mask) {
            const shape = {};
            return exports.util.objectKeys(mask).forEach(key => {
                mask[key] && this.shape[key] && (shape[key] = this.shape[key]);
            }), new ZodObject({
                ...this._def,
                shape: () => shape
            });
        }
        omit(mask) {
            const shape = {};
            return exports.util.objectKeys(this.shape).forEach(key => {
                mask[key] || (shape[key] = this.shape[key]);
            }), new ZodObject({
                ...this._def,
                shape: () => shape
            });
        }
        /**
     * @deprecated
     */
        deepPartial() {
            return deepPartialify(this);
        }
        partial(mask) {
            const newShape = {};
            return exports.util.objectKeys(this.shape).forEach(key => {
                var fieldSchema = this.shape[key];
                mask && !mask[key] ? newShape[key] = fieldSchema : newShape[key] = fieldSchema.optional();
            }), new ZodObject({
                ...this._def,
                shape: () => newShape
            });
        }
        required(mask) {
            const newShape = {};
            return exports.util.objectKeys(this.shape).forEach(key => {
                if (mask && !mask[key]) newShape[key] = this.shape[key]; else {
                    let newField = this.shape[key];
                    for (;newField instanceof ZodOptional; ) newField = newField._def.innerType;
                    newShape[key] = newField;
                }
            }), new ZodObject({
                ...this._def,
                shape: () => newShape
            });
        }
        keyof() {
            return createZodEnum(exports.util.objectKeys(this.shape));
        }
    }
    ZodObject.create = (shape, params) => new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: exports.ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
    }), ZodObject.strictCreate = (shape, params) => new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: exports.ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
    }), ZodObject.lazycreate = (shape, params) => new ZodObject({
        shape: shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: exports.ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
    });
    class ZodUnion extends ZodType {
        _parse(input) {
            const ctx = this._processInputParams(input)["ctx"];
            input = this._def.options;
            if (ctx.common.async) return Promise.all(input.map(async option => {
                var childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: []
                    },
                    parent: null
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx
                    }),
                    ctx: childCtx
                };
            })).then(function(results) {
                // return first issue-free validation if it exists
                for (const result of results) if ("valid" === result.result.status) return result.result;
                for (const result of results) if ("dirty" === result.result.status) 
                // add issues from dirty option
                return ctx.common.issues.push(...result.ctx.common.issues), result.result;
                // return invalid
                return results = results.map(result => new ZodError(result.ctx.common.issues)), 
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_union,
                    unionErrors: results
                }), INVALID;
            });
            {
                let dirty = void 0;
                var issues = [];
                for (const option of input) {
                    var childCtx = {
                        ...ctx,
                        common: {
                            ...ctx.common,
                            issues: []
                        },
                        parent: null
                    }, result = option._parseSync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx
                    });
                    if ("valid" === result.status) return result;
                    "dirty" === result.status && (dirty = dirty || {
                        result: result,
                        ctx: childCtx
                    }), childCtx.common.issues.length && issues.push(childCtx.common.issues);
                }
                return dirty ? (ctx.common.issues.push(...dirty.ctx.common.issues), 
                dirty.result) : (input = issues.map(issues => new ZodError(issues)), 
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_union,
                    unionErrors: input
                }), INVALID);
            }
        }
        get options() {
            return this._def.options;
        }
    }
    ZodUnion.create = (types, params) => new ZodUnion({
        options: types,
        typeName: exports.ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params)
    });
    /////////////////////////////////////////////////////
    /////////////////////////////////////////////////////
    //////////                                 //////////
    //////////      ZodDiscriminatedUnion      //////////
    //////////                                 //////////
    /////////////////////////////////////////////////////
    /////////////////////////////////////////////////////
    const getDiscriminator = type => type instanceof ZodLazy ? getDiscriminator(type.schema) : type instanceof ZodEffects ? getDiscriminator(type.innerType()) : type instanceof ZodLiteral ? [ type.value ] : type instanceof ZodEnum ? type.options : type instanceof ZodNativeEnum ? Object.keys(type.enum) : type instanceof ZodDefault ? getDiscriminator(type._def.innerType) : type instanceof ZodUndefined ? [ void 0 ] : type instanceof ZodNull ? [ null ] : null;
    class ZodDiscriminatedUnion extends ZodType {
        _parse(input) {
            var discriminator, discriminatorValue, input = this._processInputParams(input)["ctx"];
            return input.parsedType !== ZodParsedType.object ? (addIssueToContext(input, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: input.parsedType
            }), INVALID) : (discriminator = this.discriminator, discriminatorValue = input.data[discriminator], 
            (discriminatorValue = this.optionsMap.get(discriminatorValue)) ? input.common.async ? discriminatorValue._parseAsync({
                data: input.data,
                path: input.path,
                parent: input
            }) : discriminatorValue._parseSync({
                data: input.data,
                path: input.path,
                parent: input
            }) : (addIssueToContext(input, {
                code: ZodIssueCode.invalid_union_discriminator,
                options: Array.from(this.optionsMap.keys()),
                path: [ discriminator ]
            }), INVALID));
        }
        get discriminator() {
            return this._def.discriminator;
        }
        get options() {
            return this._def.options;
        }
        get optionsMap() {
            return this._def.optionsMap;
        }
        /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
        static create(discriminator, options, params) {
            // Get all the valid discriminator values
            var optionsMap = new Map();
            // try {
            for (const type of options) {
                var discriminatorValues = getDiscriminator(type.shape[discriminator]);
                if (!discriminatorValues) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
                for (const value of discriminatorValues) {
                    if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ` + String(value));
                    optionsMap.set(value, type);
                }
            }
            return new ZodDiscriminatedUnion({
                typeName: exports.ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
                discriminator: discriminator,
                options: options,
                optionsMap: optionsMap,
                ...processCreateParams(params)
            });
        }
    }
    function mergeValues(a, b) {
        var aType = getParsedType(a), bType = getParsedType(b);
        if (a === b) return {
            valid: !0,
            data: a
        };
        if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
            const bKeys = exports.util.objectKeys(b);
            var sharedKeys = exports.util.objectKeys(a).filter(key => -1 !== bKeys.indexOf(key)), newObj = {
                ...a,
                ...b
            };
            for (const key of sharedKeys) {
                var sharedValue = mergeValues(a[key], b[key]);
                if (!sharedValue.valid) return {
                    valid: !1
                };
                newObj[key] = sharedValue.data;
            }
            return {
                valid: !0,
                data: newObj
            };
        }
        if (aType !== ZodParsedType.array || bType !== ZodParsedType.array) return aType === ZodParsedType.date && bType === ZodParsedType.date && +a == +b ? {
            valid: !0,
            data: a
        } : {
            valid: !1
        };
        if (a.length !== b.length) return {
            valid: !1
        };
        var newArray = [];
        for (let index = 0; index < a.length; index++) {
            const sharedValue = mergeValues(a[index], b[index]);
            if (!sharedValue.valid) return {
                valid: !1
            };
            newArray.push(sharedValue.data);
        }
        return {
            valid: !0,
            data: newArray
        };
    }
    class ZodIntersection extends ZodType {
        _parse(input) {
            const {
                status,
                ctx
            } = this._processInputParams(input), handleParsed = (parsedLeft, parsedRight) => {
                var merged;
                return isAborted(parsedLeft) || isAborted(parsedRight) ? INVALID : (merged = mergeValues(parsedLeft.value, parsedRight.value)).valid ? ((isDirty(parsedLeft) || isDirty(parsedRight)) && status.dirty(), 
                {
                    status: status.value,
                    value: merged.data
                }) : (addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types
                }), INVALID);
            };
            return ctx.common.async ? Promise.all([ this._def.left._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            }), this._def.right._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            }) ]).then(([ left, right ]) => handleParsed(left, right)) : handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            }));
        }
    }
    ZodIntersection.create = (left, right, params) => new ZodIntersection({
        left: left,
        right: right,
        typeName: exports.ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params)
    });
    class ZodTuple extends ZodType {
        _parse(input) {
            const {
                status,
                ctx
            } = this._processInputParams(input);
            return ctx.parsedType !== ZodParsedType.array ? (addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType
            }), INVALID) : ctx.data.length < this._def.items.length ? (addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: !0,
                exact: !1,
                type: "array"
            }), INVALID) : (// filter nulls
            !this._def.rest && ctx.data.length > this._def.items.length && (addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: !0,
                exact: !1,
                type: "array"
            }), status.dirty()), input = [ ...ctx.data ].map((item, itemIndex) => {
                var schema = this._def.items[itemIndex] || this._def.rest;
                return schema ? schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex)) : null;
            }).filter(x => !!x), ctx.common.async ? Promise.all(input).then(results => ParseStatus.mergeArray(status, results)) : ParseStatus.mergeArray(status, input));
        }
        get items() {
            return this._def.items;
        }
        rest(rest) {
            return new ZodTuple({
                ...this._def,
                rest: rest
            });
        }
    }
    ZodTuple.create = (schemas, params) => {
        if (Array.isArray(schemas)) return new ZodTuple({
            items: schemas,
            typeName: exports.ZodFirstPartyTypeKind.ZodTuple,
            rest: null,
            ...processCreateParams(params)
        });
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    };
    class ZodRecord extends ZodType {
        get keySchema() {
            return this._def.keyType;
        }
        get valueSchema() {
            return this._def.valueType;
        }
        _parse(input) {
            var {
                status: input,
                ctx
            } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.object) return addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType
            }), INVALID;
            var pairs = [], keyType = this._def.keyType, valueType = this._def.valueType;
            for (const key in ctx.data) pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key))
            });
            return ctx.common.async ? ParseStatus.mergeObjectAsync(input, pairs) : ParseStatus.mergeObjectSync(input, pairs);
        }
        get element() {
            return this._def.valueType;
        }
        static create(first, second, third) {
            return second instanceof ZodType ? new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: exports.ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third)
            }) : new ZodRecord({
                keyType: ZodString.create(),
                valueType: first,
                typeName: exports.ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(second)
            });
        }
    }
    class ZodMap extends ZodType {
        get keySchema() {
            return this._def.keyType;
        }
        get valueSchema() {
            return this._def.valueType;
        }
        _parse(input) {
            const {
                status,
                ctx
            } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.map) return addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.map,
                received: ctx.parsedType
            }), INVALID;
            const keyType = this._def.keyType, valueType = this._def.valueType, pairs = [ ...ctx.data.entries() ].map(([ key, value ], index) => ({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [ index, "key" ])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [ index, "value" ]))
            }));
            if (ctx.common.async) {
                const finalMap = new Map();
                return Promise.resolve().then(async () => {
                    for (const pair of pairs) {
                        var key = await pair.key, value = await pair.value;
                        if ("aborted" === key.status || "aborted" === value.status) return INVALID;
                        "dirty" !== key.status && "dirty" !== value.status || status.dirty(), 
                        finalMap.set(key.value, value.value);
                    }
                    return {
                        status: status.value,
                        value: finalMap
                    };
                });
            }
            var finalMap = new Map();
            for (const pair of pairs) {
                var key = pair.key, value = pair.value;
                if ("aborted" === key.status || "aborted" === value.status) return INVALID;
                "dirty" !== key.status && "dirty" !== value.status || status.dirty(), 
                finalMap.set(key.value, value.value);
            }
            return {
                status: status.value,
                value: finalMap
            };
        }
    }
    ZodMap.create = (keyType, valueType, params) => new ZodMap({
        valueType: valueType,
        keyType: keyType,
        typeName: exports.ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params)
    });
    class ZodSet extends ZodType {
        _parse(input) {
            const {
                status,
                ctx
            } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.set) return addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.set,
                received: ctx.parsedType
            }), INVALID;
            input = this._def;
            null !== input.minSize && ctx.data.size < input.minSize.value && (addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: input.minSize.value,
                type: "set",
                inclusive: !0,
                exact: !1,
                message: input.minSize.message
            }), status.dirty()), null !== input.maxSize && ctx.data.size > input.maxSize.value && (addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: input.maxSize.value,
                type: "set",
                inclusive: !0,
                exact: !1,
                message: input.maxSize.message
            }), status.dirty());
            const valueType = this._def.valueType;
            function finalizeSet(elements) {
                var parsedSet = new Set();
                for (const element of elements) {
                    if ("aborted" === element.status) return INVALID;
                    "dirty" === element.status && status.dirty(), parsedSet.add(element.value);
                }
                return {
                    status: status.value,
                    value: parsedSet
                };
            }
            input = [ ...ctx.data.values() ].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
            return ctx.common.async ? Promise.all(input).then(elements => finalizeSet(elements)) : finalizeSet(input);
        }
        min(minSize, message) {
            return new ZodSet({
                ...this._def,
                minSize: {
                    value: minSize,
                    message: errorUtil.toString(message)
                }
            });
        }
        max(maxSize, message) {
            return new ZodSet({
                ...this._def,
                maxSize: {
                    value: maxSize,
                    message: errorUtil.toString(message)
                }
            });
        }
        size(size, message) {
            return this.min(size, message).max(size, message);
        }
        nonempty(message) {
            return this.min(1, message);
        }
    }
    ZodSet.create = (valueType, params) => new ZodSet({
        valueType: valueType,
        minSize: null,
        maxSize: null,
        typeName: exports.ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params)
    });
    class ZodFunction extends ZodType {
        constructor() {
            super(...arguments), this.validate = this.implement;
        }
        _parse(input) {
            const ctx = this._processInputParams(input)["ctx"];
            if (ctx.parsedType !== ZodParsedType.function) return addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.function,
                received: ctx.parsedType
            }), INVALID;
            function makeArgsIssue(args, error) {
                return makeIssue({
                    data: args,
                    path: ctx.path,
                    errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap ].filter(x => !!x),
                    issueData: {
                        code: ZodIssueCode.invalid_arguments,
                        argumentsError: error
                    }
                });
            }
            function makeReturnsIssue(returns, error) {
                return makeIssue({
                    data: returns,
                    path: ctx.path,
                    errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap ].filter(x => !!x),
                    issueData: {
                        code: ZodIssueCode.invalid_return_type,
                        returnTypeError: error
                    }
                });
            }
            const params = {
                errorMap: ctx.common.contextualErrorMap
            }, fn = ctx.data;
            if (this._def.returns instanceof ZodPromise) {
                // Would love a way to avoid disabling this rule, but we need
                // an alias (using an arrow function was what caused 2651).
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const me = this;
                return OK(async function(...args) {
                    const error = new ZodError([]);
                    var parsedArgs = await me._def.args.parseAsync(args, params).catch(e => {
                        throw error.addIssue(makeArgsIssue(args, e)), error;
                    });
                    const result = await Reflect.apply(fn, this, parsedArgs);
                    return await me._def.returns._def.type.parseAsync(result, params).catch(e => {
                        throw error.addIssue(makeReturnsIssue(result, e)), error;
                    });
                });
            }
            {
                // Would love a way to avoid disabling this rule, but we need
                // an alias (using an arrow function was what caused 2651).
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const me = this;
                return OK(function(...args) {
                    var parsedArgs = me._def.args.safeParse(args, params);
                    if (!parsedArgs.success) throw new ZodError([ makeArgsIssue(args, parsedArgs.error) ]);
                    args = Reflect.apply(fn, this, parsedArgs.data), parsedArgs = me._def.returns.safeParse(args, params);
                    if (parsedArgs.success) return parsedArgs.data;
                    throw new ZodError([ makeReturnsIssue(args, parsedArgs.error) ]);
                });
            }
        }
        parameters() {
            return this._def.args;
        }
        returnType() {
            return this._def.returns;
        }
        args(...items) {
            return new ZodFunction({
                ...this._def,
                args: ZodTuple.create(items).rest(ZodUnknown.create())
            });
        }
        returns(returnType) {
            return new ZodFunction({
                ...this._def,
                returns: returnType
            });
        }
        implement(func) {
            return this.parse(func);
        }
        strictImplement(func) {
            return this.parse(func);
        }
        static create(args, returns, params) {
            return new ZodFunction({
                args: args || ZodTuple.create([]).rest(ZodUnknown.create()),
                returns: returns || ZodUnknown.create(),
                typeName: exports.ZodFirstPartyTypeKind.ZodFunction,
                ...processCreateParams(params)
            });
        }
    }
    class ZodLazy extends ZodType {
        get schema() {
            return this._def.getter();
        }
        _parse(input) {
            input = this._processInputParams(input).ctx;
            return this._def.getter()._parse({
                data: input.data,
                path: input.path,
                parent: input
            });
        }
    }
    ZodLazy.create = (getter, params) => new ZodLazy({
        getter: getter,
        typeName: exports.ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params)
    });
    class ZodLiteral extends ZodType {
        _parse(input) {
            var ctx;
            return input.data !== this._def.value ? (addIssueToContext(ctx = this._getOrReturnCtx(input), {
                received: ctx.data,
                code: ZodIssueCode.invalid_literal,
                expected: this._def.value
            }), INVALID) : {
                status: "valid",
                value: input.data
            };
        }
        get value() {
            return this._def.value;
        }
    }
    function createZodEnum(values, params) {
        return new ZodEnum({
            values: values,
            typeName: exports.ZodFirstPartyTypeKind.ZodEnum,
            ...processCreateParams(params)
        });
    }
    ZodLiteral.create = (value, params) => new ZodLiteral({
        value: value,
        typeName: exports.ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params)
    });
    class ZodEnum extends ZodType {
        _parse(input) {
            var ctx, expectedValues;
            if ("string" != typeof input.data) return ctx = this._getOrReturnCtx(input), 
            expectedValues = this._def.values, addIssueToContext(ctx, {
                expected: exports.util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type
            }), INVALID;
            if (-1 !== this._def.values.indexOf(input.data)) return OK(input.data);
            {
                const ctx = this._getOrReturnCtx(input), expectedValues = this._def.values;
                return addIssueToContext(ctx, {
                    received: ctx.data,
                    code: ZodIssueCode.invalid_enum_value,
                    options: expectedValues
                }), INVALID;
            }
        }
        get options() {
            return this._def.values;
        }
        get enum() {
            var enumValues = {};
            for (const val of this._def.values) enumValues[val] = val;
            return enumValues;
        }
        get Values() {
            var enumValues = {};
            for (const val of this._def.values) enumValues[val] = val;
            return enumValues;
        }
        get Enum() {
            var enumValues = {};
            for (const val of this._def.values) enumValues[val] = val;
            return enumValues;
        }
        extract(values) {
            return ZodEnum.create(values);
        }
        exclude(values) {
            return ZodEnum.create(this.options.filter(opt => !values.includes(opt)));
        }
    }
    ZodEnum.create = createZodEnum;
    class ZodNativeEnum extends ZodType {
        _parse(input) {
            var expectedValues, nativeEnumValues = exports.util.getValidEnumValues(this._def.values), ctx = this._getOrReturnCtx(input);
            if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) return expectedValues = exports.util.objectValues(nativeEnumValues), 
            addIssueToContext(ctx, {
                expected: exports.util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type
            }), INVALID;
            if (-1 !== nativeEnumValues.indexOf(input.data)) return OK(input.data);
            {
                const expectedValues = exports.util.objectValues(nativeEnumValues);
                return addIssueToContext(ctx, {
                    received: ctx.data,
                    code: ZodIssueCode.invalid_enum_value,
                    options: expectedValues
                }), INVALID;
            }
        }
        get enum() {
            return this._def.values;
        }
    }
    ZodNativeEnum.create = (values, params) => new ZodNativeEnum({
        values: values,
        typeName: exports.ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params)
    });
    class ZodPromise extends ZodType {
        unwrap() {
            return this._def.type;
        }
        _parse(input) {
            const ctx = this._processInputParams(input)["ctx"];
            return ctx.parsedType !== ZodParsedType.promise && !1 === ctx.common.async ? (addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.promise,
                received: ctx.parsedType
            }), INVALID) : (input = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data), 
            OK(input.then(data => this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap
            }))));
        }
    }
    ZodPromise.create = (schema, params) => new ZodPromise({
        type: schema,
        typeName: exports.ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params)
    });
    class ZodEffects extends ZodType {
        innerType() {
            return this._def.schema;
        }
        sourceType() {
            return this._def.schema._def.typeName === exports.ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
        }
        _parse(input) {
            const {
                status,
                ctx
            } = this._processInputParams(input), effect = this._def.effect || null, checkCtx = {
                addIssue: arg => {
                    addIssueToContext(ctx, arg), arg.fatal ? status.abort() : status.dirty();
                },
                get path() {
                    return ctx.path;
                }
            };
            if (checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx), "preprocess" === effect.type) return input = effect.transform(ctx.data, checkCtx), 
            ctx.common.issues.length ? {
                status: "dirty",
                value: ctx.data
            } : ctx.common.async ? Promise.resolve(input).then(processed => this._def.schema._parseAsync({
                data: processed,
                path: ctx.path,
                parent: ctx
            })) : this._def.schema._parseSync({
                data: input,
                path: ctx.path,
                parent: ctx
            });
            if ("refinement" === effect.type) {
                const executeRefinement = acc => {
                    var result = effect.refinement(acc, checkCtx);
                    if (ctx.common.async) return Promise.resolve(result);
                    if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                    return acc;
                };
                return !1 === ctx.common.async ? "aborted" === (input = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                })).status ? INVALID : ("dirty" === input.status && status.dirty(), 
                // return value is ignored
                executeRefinement(input.value), {
                    status: status.value,
                    value: input.value
                }) : this._def.schema._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                }).then(inner => "aborted" === inner.status ? INVALID : ("dirty" === inner.status && status.dirty(), 
                executeRefinement(inner.value).then(() => ({
                    status: status.value,
                    value: inner.value
                }))));
            }
            if ("transform" === effect.type) {
                if (!1 !== ctx.common.async) return this._def.schema._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                }).then(base => isValid(base) ? Promise.resolve(effect.transform(base.value, checkCtx)).then(result => ({
                    status: status.value,
                    value: result
                })) : base);
                input = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                });
                if (!isValid(input)) return input;
                input = effect.transform(input.value, checkCtx);
                if (input instanceof Promise) throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
                return {
                    status: status.value,
                    value: input
                };
            }
            exports.util.assertNever(effect);
        }
    }
    ZodEffects.create = (schema, effect, params) => new ZodEffects({
        schema: schema,
        typeName: exports.ZodFirstPartyTypeKind.ZodEffects,
        effect: effect,
        ...processCreateParams(params)
    }), ZodEffects.createWithPreprocess = (preprocess, schema, params) => new ZodEffects({
        schema: schema,
        effect: {
            type: "preprocess",
            transform: preprocess
        },
        typeName: exports.ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params)
    });
    class ZodOptional extends ZodType {
        _parse(input) {
            return this._getType(input) === ZodParsedType.undefined ? OK(void 0) : this._def.innerType._parse(input);
        }
        unwrap() {
            return this._def.innerType;
        }
    }
    ZodOptional.create = (type, params) => new ZodOptional({
        innerType: type,
        typeName: exports.ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params)
    });
    class ZodNullable extends ZodType {
        _parse(input) {
            return this._getType(input) === ZodParsedType.null ? OK(null) : this._def.innerType._parse(input);
        }
        unwrap() {
            return this._def.innerType;
        }
    }
    ZodNullable.create = (type, params) => new ZodNullable({
        innerType: type,
        typeName: exports.ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params)
    });
    class ZodDefault extends ZodType {
        _parse(input) {
            input = this._processInputParams(input).ctx;
            let data = input.data;
            return input.parsedType === ZodParsedType.undefined && (data = this._def.defaultValue()), 
            this._def.innerType._parse({
                data: data,
                path: input.path,
                parent: input
            });
        }
        removeDefault() {
            return this._def.innerType;
        }
    }
    ZodDefault.create = (type, params) => new ZodDefault({
        innerType: type,
        typeName: exports.ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: "function" == typeof params.default ? params.default : () => params.default,
        ...processCreateParams(params)
    });
    class ZodCatch extends ZodType {
        _parse(input) {
            input = this._processInputParams(input).ctx;
            // newCtx is used to not collect issues from inner types in ctx
            const newCtx = {
                ...input,
                common: {
                    ...input.common,
                    issues: []
                }
            };
            input = this._def.innerType._parse({
                data: newCtx.data,
                path: newCtx.path,
                parent: {
                    ...newCtx
                }
            });
            return isAsync(input) ? input.then(result => ({
                status: "valid",
                value: "valid" === result.status ? result.value : this._def.catchValue({
                    get error() {
                        return new ZodError(newCtx.common.issues);
                    },
                    input: newCtx.data
                })
            })) : {
                status: "valid",
                value: "valid" === input.status ? input.value : this._def.catchValue({
                    get error() {
                        return new ZodError(newCtx.common.issues);
                    },
                    input: newCtx.data
                })
            };
        }
        removeCatch() {
            return this._def.innerType;
        }
    }
    ZodCatch.create = (type, params) => new ZodCatch({
        innerType: type,
        typeName: exports.ZodFirstPartyTypeKind.ZodCatch,
        catchValue: "function" == typeof params.catch ? params.catch : () => params.catch,
        ...processCreateParams(params)
    });
    class ZodNaN extends ZodType {
        _parse(input) {
            var ctx;
            return this._getType(input) !== ZodParsedType.nan ? (addIssueToContext(ctx = this._getOrReturnCtx(input), {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.nan,
                received: ctx.parsedType
            }), INVALID) : {
                status: "valid",
                value: input.data
            };
        }
    }
    ZodNaN.create = params => new ZodNaN({
        typeName: exports.ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params)
    });
    var BRAND = Symbol("zod_brand");
    class ZodBranded extends ZodType {
        _parse(input) {
            var input = this._processInputParams(input)["ctx"], data = input.data;
            return this._def.type._parse({
                data: data,
                path: input.path,
                parent: input
            });
        }
        unwrap() {
            return this._def.type;
        }
    }
    class ZodPipeline extends ZodType {
        _parse(input) {
            const {
                status,
                ctx
            } = this._processInputParams(input);
            return ctx.common.async ? (async () => {
                var inResult = await this._def.in._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                });
                return "aborted" === inResult.status ? INVALID : "dirty" === inResult.status ? (status.dirty(), 
                DIRTY(inResult.value)) : this._def.out._parseAsync({
                    data: inResult.value,
                    path: ctx.path,
                    parent: ctx
                });
            })() : "aborted" === (input = this._def.in._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            })).status ? INVALID : "dirty" === input.status ? (status.dirty(), {
                status: "dirty",
                value: input.value
            }) : this._def.out._parseSync({
                data: input.value,
                path: ctx.path,
                parent: ctx
            });
        }
        static create(a, b) {
            return new ZodPipeline({
                in: a,
                out: b,
                typeName: exports.ZodFirstPartyTypeKind.ZodPipeline
            });
        }
    }
    class ZodReadonly extends ZodType {
        _parse(input) {
            input = this._def.innerType._parse(input);
            return isValid(input) && (input.value = Object.freeze(input.value)), 
            input;
        }
    }
    ZodReadonly.create = (type, params) => new ZodReadonly({
        innerType: type,
        typeName: exports.ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params)
    });
    const custom = (check, params = {}, 
    /**
 * @deprecated
 *
 * Pass `fatal` into the params object instead:
 *
 * ```ts
 * z.string().custom((val) => val.length > 5, { fatal: false })
 * ```
 *
 */
    fatal) => check ? ZodAny.create().superRefine((data, ctx) => {
        var _a;
        check(data) || (_a = null == (_a = null != (_a = (data = "function" == typeof params ? params(data) : "string" == typeof params ? {
            message: params
        } : params).fatal) ? _a : fatal) || _a, ctx.addIssue({
            code: "custom",
            ..."string" == typeof data ? {
                message: data
            } : data,
            fatal: _a
        }));
    }) : ZodAny.create();
    var late = {
        object: ZodObject.lazycreate
    }, ZodFirstPartyTypeKind = (exports.ZodFirstPartyTypeKind = void 0, (ZodFirstPartyTypeKind = exports.ZodFirstPartyTypeKind || (exports.ZodFirstPartyTypeKind = {})).ZodString = "ZodString", 
    ZodFirstPartyTypeKind.ZodNumber = "ZodNumber", ZodFirstPartyTypeKind.ZodNaN = "ZodNaN", 
    ZodFirstPartyTypeKind.ZodBigInt = "ZodBigInt", ZodFirstPartyTypeKind.ZodBoolean = "ZodBoolean", 
    ZodFirstPartyTypeKind.ZodDate = "ZodDate", ZodFirstPartyTypeKind.ZodSymbol = "ZodSymbol", 
    ZodFirstPartyTypeKind.ZodUndefined = "ZodUndefined", ZodFirstPartyTypeKind.ZodNull = "ZodNull", 
    ZodFirstPartyTypeKind.ZodAny = "ZodAny", ZodFirstPartyTypeKind.ZodUnknown = "ZodUnknown", 
    ZodFirstPartyTypeKind.ZodNever = "ZodNever", ZodFirstPartyTypeKind.ZodVoid = "ZodVoid", 
    ZodFirstPartyTypeKind.ZodArray = "ZodArray", ZodFirstPartyTypeKind.ZodObject = "ZodObject", 
    ZodFirstPartyTypeKind.ZodUnion = "ZodUnion", ZodFirstPartyTypeKind.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", 
    ZodFirstPartyTypeKind.ZodIntersection = "ZodIntersection", ZodFirstPartyTypeKind.ZodTuple = "ZodTuple", 
    ZodFirstPartyTypeKind.ZodRecord = "ZodRecord", ZodFirstPartyTypeKind.ZodMap = "ZodMap", 
    ZodFirstPartyTypeKind.ZodSet = "ZodSet", ZodFirstPartyTypeKind.ZodFunction = "ZodFunction", 
    ZodFirstPartyTypeKind.ZodLazy = "ZodLazy", ZodFirstPartyTypeKind.ZodLiteral = "ZodLiteral", 
    ZodFirstPartyTypeKind.ZodEnum = "ZodEnum", ZodFirstPartyTypeKind.ZodEffects = "ZodEffects", 
    ZodFirstPartyTypeKind.ZodNativeEnum = "ZodNativeEnum", ZodFirstPartyTypeKind.ZodOptional = "ZodOptional", 
    ZodFirstPartyTypeKind.ZodNullable = "ZodNullable", ZodFirstPartyTypeKind.ZodDefault = "ZodDefault", 
    ZodFirstPartyTypeKind.ZodCatch = "ZodCatch", ZodFirstPartyTypeKind.ZodPromise = "ZodPromise", 
    ZodFirstPartyTypeKind.ZodBranded = "ZodBranded", ZodFirstPartyTypeKind.ZodPipeline = "ZodPipeline", 
    ZodFirstPartyTypeKind.ZodReadonly = "ZodReadonly", 
    // const instanceOfType = <T extends new (...args: any[]) => any>(
    (cls, params = {
        message: "Input not instance of " + cls.name
    }) => custom(data => data instanceof cls, params));
    const stringType = ZodString.create, numberType = ZodNumber.create;
    var nanType = ZodNaN.create, bigIntType = ZodBigInt.create;
    const booleanType = ZodBoolean.create;
    var dateType = ZodDate.create, symbolType = ZodSymbol.create, undefinedType = ZodUndefined.create, nullType = ZodNull.create, anyType = ZodAny.create, unknownType = ZodUnknown.create, neverType = ZodNever.create, voidType = ZodVoid.create, arrayType = ZodArray.create, objectType = ZodObject.create, strictObjectType = ZodObject.strictCreate, unionType = ZodUnion.create, discriminatedUnionType = ZodDiscriminatedUnion.create, intersectionType = ZodIntersection.create, tupleType = ZodTuple.create, recordType = ZodRecord.create, mapType = ZodMap.create, setType = ZodSet.create, functionType = ZodFunction.create, lazyType = ZodLazy.create, literalType = ZodLiteral.create, enumType = ZodEnum.create, nativeEnumType = ZodNativeEnum.create, promiseType = ZodPromise.create, effectsType = ZodEffects.create, optionalType = ZodOptional.create, nullableType = ZodNullable.create, preprocessType = ZodEffects.createWithPreprocess, pipelineType = ZodPipeline.create, ostring = () => stringType().optional(), onumber = () => numberType().optional(), oboolean = () => booleanType().optional(), coerce = {
        string: arg => ZodString.create({
            ...arg,
            coerce: !0
        }),
        number: arg => ZodNumber.create({
            ...arg,
            coerce: !0
        }),
        boolean: arg => ZodBoolean.create({
            ...arg,
            coerce: !0
        }),
        bigint: arg => ZodBigInt.create({
            ...arg,
            coerce: !0
        }),
        date: arg => ZodDate.create({
            ...arg,
            coerce: !0
        })
    }, NEVER = INVALID, z = Object.freeze(Object.defineProperty({
        __proto__: null,
        defaultErrorMap: errorMap,
        setErrorMap: setErrorMap,
        getErrorMap: getErrorMap,
        makeIssue: makeIssue,
        EMPTY_PATH: EMPTY_PATH,
        addIssueToContext: addIssueToContext,
        ParseStatus: ParseStatus,
        INVALID: INVALID,
        DIRTY: DIRTY,
        OK: OK,
        isAborted: isAborted,
        isDirty: isDirty,
        isValid: isValid,
        isAsync: isAsync,
        get util() {
            return exports.util;
        },
        get objectUtil() {
            return exports.objectUtil;
        },
        ZodParsedType: ZodParsedType,
        getParsedType: getParsedType,
        ZodType: ZodType,
        ZodString: ZodString,
        ZodNumber: ZodNumber,
        ZodBigInt: ZodBigInt,
        ZodBoolean: ZodBoolean,
        ZodDate: ZodDate,
        ZodSymbol: ZodSymbol,
        ZodUndefined: ZodUndefined,
        ZodNull: ZodNull,
        ZodAny: ZodAny,
        ZodUnknown: ZodUnknown,
        ZodNever: ZodNever,
        ZodVoid: ZodVoid,
        ZodArray: ZodArray,
        ZodObject: ZodObject,
        ZodUnion: ZodUnion,
        ZodDiscriminatedUnion: ZodDiscriminatedUnion,
        ZodIntersection: ZodIntersection,
        ZodTuple: ZodTuple,
        ZodRecord: ZodRecord,
        ZodMap: ZodMap,
        ZodSet: ZodSet,
        ZodFunction: ZodFunction,
        ZodLazy: ZodLazy,
        ZodLiteral: ZodLiteral,
        ZodEnum: ZodEnum,
        ZodNativeEnum: ZodNativeEnum,
        ZodPromise: ZodPromise,
        ZodEffects: ZodEffects,
        ZodTransformer: ZodEffects,
        ZodOptional: ZodOptional,
        ZodNullable: ZodNullable,
        ZodDefault: ZodDefault,
        ZodCatch: ZodCatch,
        ZodNaN: ZodNaN,
        BRAND: BRAND,
        ZodBranded: ZodBranded,
        ZodPipeline: ZodPipeline,
        ZodReadonly: ZodReadonly,
        custom: custom,
        Schema: ZodType,
        ZodSchema: ZodType,
        late: late,
        get ZodFirstPartyTypeKind() {
            return exports.ZodFirstPartyTypeKind;
        },
        coerce: coerce,
        any: anyType,
        array: arrayType,
        bigint: bigIntType,
        boolean: booleanType,
        date: dateType,
        discriminatedUnion: discriminatedUnionType,
        effect: effectsType,
        enum: enumType,
        function: functionType,
        instanceof: ZodFirstPartyTypeKind,
        intersection: intersectionType,
        lazy: lazyType,
        literal: literalType,
        map: mapType,
        nan: nanType,
        nativeEnum: nativeEnumType,
        never: neverType,
        null: nullType,
        nullable: nullableType,
        number: numberType,
        object: objectType,
        oboolean: oboolean,
        onumber: onumber,
        optional: optionalType,
        ostring: ostring,
        pipeline: pipelineType,
        preprocess: preprocessType,
        promise: promiseType,
        record: recordType,
        set: setType,
        strictObject: strictObjectType,
        string: stringType,
        symbol: symbolType,
        transformer: effectsType,
        tuple: tupleType,
        undefined: undefinedType,
        union: unionType,
        unknown: unknownType,
        void: voidType,
        NEVER: NEVER,
        ZodIssueCode: ZodIssueCode,
        quotelessJson: quotelessJson,
        ZodError: ZodError
    }, Symbol.toStringTag, {
        value: "Module"
    }));
    exports.BRAND = BRAND, exports.DIRTY = DIRTY, exports.EMPTY_PATH = EMPTY_PATH, 
    exports.INVALID = INVALID, exports.NEVER = NEVER, exports.OK = OK, exports.ParseStatus = ParseStatus, 
    exports.Schema = ZodType, exports.ZodAny = ZodAny, exports.ZodArray = ZodArray, 
    exports.ZodBigInt = ZodBigInt, exports.ZodBoolean = ZodBoolean, exports.ZodBranded = ZodBranded, 
    exports.ZodCatch = ZodCatch, exports.ZodDate = ZodDate, exports.ZodDefault = ZodDefault, 
    exports.ZodDiscriminatedUnion = ZodDiscriminatedUnion, exports.ZodEffects = ZodEffects, 
    exports.ZodEnum = ZodEnum, exports.ZodError = ZodError, exports.ZodFunction = ZodFunction, 
    exports.ZodIntersection = ZodIntersection, exports.ZodIssueCode = ZodIssueCode, 
    exports.ZodLazy = ZodLazy, exports.ZodLiteral = ZodLiteral, exports.ZodMap = ZodMap, 
    exports.ZodNaN = ZodNaN, exports.ZodNativeEnum = ZodNativeEnum, exports.ZodNever = ZodNever, 
    exports.ZodNull = ZodNull, exports.ZodNullable = ZodNullable, exports.ZodNumber = ZodNumber, 
    exports.ZodObject = ZodObject, exports.ZodOptional = ZodOptional, exports.ZodParsedType = ZodParsedType, 
    exports.ZodPipeline = ZodPipeline, exports.ZodPromise = ZodPromise, exports.ZodReadonly = ZodReadonly, 
    exports.ZodRecord = ZodRecord, exports.ZodSchema = ZodType, exports.ZodSet = ZodSet, 
    exports.ZodString = ZodString, exports.ZodSymbol = ZodSymbol, exports.ZodTransformer = ZodEffects, 
    exports.ZodTuple = ZodTuple, exports.ZodType = ZodType, exports.ZodUndefined = ZodUndefined, 
    exports.ZodUnion = ZodUnion, exports.ZodUnknown = ZodUnknown, exports.ZodVoid = ZodVoid, 
    exports.addIssueToContext = addIssueToContext, exports.any = anyType, exports.array = arrayType, 
    exports.bigint = bigIntType, exports.boolean = booleanType, exports.coerce = coerce, 
    exports.custom = custom, exports.date = dateType, exports.default = z, exports.defaultErrorMap = errorMap, 
    exports.discriminatedUnion = discriminatedUnionType, exports.effect = effectsType, 
    exports.enum = enumType, exports.function = functionType, exports.getErrorMap = getErrorMap, 
    exports.getParsedType = getParsedType, exports.instanceof = ZodFirstPartyTypeKind, 
    exports.intersection = intersectionType, exports.isAborted = isAborted, exports.isAsync = isAsync, 
    exports.isDirty = isDirty, exports.isValid = isValid, exports.late = late, exports.lazy = lazyType, 
    exports.literal = literalType, exports.makeIssue = makeIssue, exports.map = mapType, 
    exports.nan = nanType, exports.nativeEnum = nativeEnumType, exports.never = neverType, 
    exports.null = nullType, exports.nullable = nullableType, exports.number = numberType, 
    exports.object = objectType, exports.oboolean = oboolean, exports.onumber = onumber, 
    exports.optional = optionalType, exports.ostring = ostring, exports.pipeline = pipelineType, 
    exports.preprocess = preprocessType, exports.promise = promiseType, exports.quotelessJson = quotelessJson, 
    exports.record = recordType, exports.set = setType, exports.setErrorMap = setErrorMap, 
    exports.strictObject = strictObjectType, exports.string = stringType, exports.symbol = symbolType, 
    exports.transformer = effectsType, exports.tuple = tupleType, exports.undefined = undefinedType, 
    exports.union = unionType, exports.unknown = unknownType, exports.void = voidType, 
    exports.z = z, module.exports = exports, require("engine").log(`Loaded: ${name} | v${version} | ` + author);
});