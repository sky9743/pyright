/*
* typeAnalyzer.test.ts
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT license.
* Author: Eric Traut
*
* Unit tests for pyright type analyzer.
*/

import * as assert from 'assert';

import { AnalyzerNodeInfo } from '../analyzer/analyzerNodeInfo';
import { ScopeType } from '../analyzer/scope';
import { ConfigOptions } from '../common/configOptions';
import StringMap from '../common/stringMap';
import { FileAnalysisResult, TestUtils } from './testUtils';

test('Builtins1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['builtins1.py']);

    assert.equal(analysisResults.length, 1);
    assert.notEqual(analysisResults[0].parseResults, undefined);
    assert.equal(analysisResults[0].errors.length, 0);
    assert.equal(analysisResults[0].warnings.length, 0);

    // This list comes from python directly.
    // `python`
    // `import builtins
    // `dir(builtins)`
    // Remove True, False, None, _, __build_class__, __debug__, __doc__
    const expectedBuiltinsSymbols = [
        'ArithmeticError', 'AssertionError', 'AttributeError', 'BaseException',
        'BlockingIOError', 'BrokenPipeError', 'BufferError', 'BytesWarning',
        'ChildProcessError', 'ConnectionAbortedError', 'ConnectionError',
        'ConnectionRefusedError', 'ConnectionResetError', 'DeprecationWarning',
        'EOFError', 'Ellipsis', 'EnvironmentError', 'Exception',
        'FileExistsError', 'FileNotFoundError', 'FloatingPointError',
        'FutureWarning', 'GeneratorExit', 'IOError', 'ImportError',
        'ImportWarning', 'IndentationError', 'IndexError', 'InterruptedError',
        'IsADirectoryError', 'KeyError', 'KeyboardInterrupt', 'LookupError',
        'MemoryError', 'NameError', 'NotADirectoryError', 'NotImplemented',
        'NotImplementedError', 'OSError', 'OverflowError', 'PendingDeprecationWarning',
        'PermissionError', 'ProcessLookupError', 'RecursionError', 'ReferenceError',
        'ResourceWarning', 'RuntimeError', 'RuntimeWarning', 'StopAsyncIteration',
        'StopIteration', 'SyntaxError', 'SyntaxWarning', 'SystemError', 'SystemExit',
        'TabError', 'TimeoutError', 'TypeError', 'UnboundLocalError',
        'UnicodeDecodeError', 'UnicodeEncodeError', 'UnicodeError', 'UnicodeTranslateError',
        'UnicodeWarning', 'UserWarning', 'ValueError', 'Warning', 'ZeroDivisionError',
        '__import__', '__loader__', '__name__',
        '__package__', '__spec__', 'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'breakpoint',
        'bytearray', 'bytes', 'callable', 'chr', 'classmethod', 'compile', 'complex',
        'copyright', 'credits', 'delattr', 'dict', 'dir', 'divmod', 'enumerate', 'eval',
        'exec', 'exit', 'filter', 'float', 'format', 'frozenset', 'getattr', 'globals',
        'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance',
        'issubclass', 'iter', 'len', 'license', 'list', 'locals', 'map', 'max',
        'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print',
        'property', 'quit', 'range', 'repr', 'reversed', 'round', 'set', 'setattr',
        'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type',
        'vars', 'zip'];

    const moduleScope = AnalyzerNodeInfo.getScope(analysisResults[0].parseResults!.parseTree)!;
    assert.notEqual(moduleScope, undefined);

    const builtinsScope = moduleScope.getParent()!;
    assert.notEqual(builtinsScope, undefined);
    assert.equal(builtinsScope.getType(), ScopeType.BuiltIn);

    // Make sure all the expected symbols are present.
    const builtinsSymbolTable = builtinsScope.getSymbolTable();
    for (const symbolName of expectedBuiltinsSymbols) {
        const symbol = moduleScope.lookUpSymbolRecursive(symbolName);
        if (symbol === undefined) {
            assert.fail(`${ symbolName } is missing from builtins scope`);
        }
    }

    // Make sure the builtins scope doesn't contain symbols that
    // shouldn't be present.
    const symbolMap = new StringMap<string>();
    for (const symbolName of expectedBuiltinsSymbols) {
        symbolMap.set(symbolName, symbolName);
    }

    for (const builtinName of builtinsSymbolTable.getKeys()) {
        const symbolInfo = moduleScope.lookUpSymbolRecursive(builtinName);
        if (symbolInfo && symbolInfo.isBeyondExecutionScope) {
            if (symbolMap.get(builtinName) === undefined) {
                assert.fail(`${ builtinName } should not be in builtins scope`);
            }
        }
    }
});

function validateResults(results: FileAnalysisResult[], errorCount: number, warningCount = 0) {
    assert.equal(results.length, 1);
    assert.equal(results[0].errors.length, errorCount);
    assert.equal(results[0].warnings.length, warningCount);
}

test('TypeConstraint1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['typeConstraint1.py']);

    validateResults(analysisResults, 6);
});

test('TypeConstraint2', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['typeConstraint2.py']);

    validateResults(analysisResults, 4);
});

test('TypeConstraint3', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['typeConstraint3.py']);

    validateResults(analysisResults, 1);
});

test('CircularBaseClass', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['circularBaseClass.py']);

    validateResults(analysisResults, 4);
});

test('ReturnTypes1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['returnTypes1.py']);

    validateResults(analysisResults, 2);
});

test('Specialization1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['specialization1.py']);

    validateResults(analysisResults, 7);
});

test('Expressions1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['expressions1.py']);

    validateResults(analysisResults, 3);
});

test('Expressions2', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['expressions2.py']);

    validateResults(analysisResults, 1);
});

test('Expressions3', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['expressions3.py']);

    validateResults(analysisResults, 1);
});

test('Lambda1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['lambda1.py']);

    validateResults(analysisResults, 5);
});

test('Function1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['function1.py']);

    validateResults(analysisResults, 5);
});

test('Function2', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['function2.py']);

    validateResults(analysisResults, 6);
});

test('Annotations1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['annotations1.py']);

    validateResults(analysisResults, 2);
});

test('Annotations2', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['annotations2.py']);

    validateResults(analysisResults, 2);
});

test('Annotations3', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['annotations3.py']);

    validateResults(analysisResults, 0);
});

test('AnnotatedVar1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['annotatedVar1.py']);

    validateResults(analysisResults, 2);
});

test('AnnotatedVar2', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['annotatedVar2.py']);

    validateResults(analysisResults, 7);
});

test('AnnotatedVar3', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['annotatedVar3.py']);

    validateResults(analysisResults, 7);
});

test('AnnotatedVar4', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['annotatedVar4.py']);

    validateResults(analysisResults, 9);
});

test('AnnotatedVar5', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['annotatedVar5.py']);

    validateResults(analysisResults, 7);
});

test('Execution1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['execution1.py']);

    validateResults(analysisResults, 2);
});

test('Properties1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['properties1.py']);

    validateResults(analysisResults, 5);
});

test('Operators1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['operators1.py']);

    validateResults(analysisResults, 3);
});

test('Optional1', () => {
    const configOptions = new ConfigOptions('.');

    // By default, optional diagnostics are ignored.
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['optional1.py'], configOptions);
    validateResults(analysisResults, 0);

    // Turn on warnings.
    configOptions.diagnosticSettings.reportOptionalSubscript = 'warning';
    configOptions.diagnosticSettings.reportOptionalMemberAccess = 'warning';
    configOptions.diagnosticSettings.reportOptionalCall = 'warning';
    configOptions.diagnosticSettings.reportOptionalIterable = 'warning';
    configOptions.diagnosticSettings.reportOptionalContextManager = 'warning';
    configOptions.diagnosticSettings.reportOptionalOperand = 'warning';
    analysisResults = TestUtils.typeAnalyzeSampleFiles(['optional1.py'], configOptions);
    validateResults(analysisResults, 0, 7);

    // Turn on errors.
    configOptions.diagnosticSettings.reportOptionalSubscript = 'error';
    configOptions.diagnosticSettings.reportOptionalMemberAccess = 'error';
    configOptions.diagnosticSettings.reportOptionalCall = 'error';
    configOptions.diagnosticSettings.reportOptionalIterable = 'error';
    configOptions.diagnosticSettings.reportOptionalContextManager = 'error';
    configOptions.diagnosticSettings.reportOptionalOperand = 'error';
    analysisResults = TestUtils.typeAnalyzeSampleFiles(['optional1.py'], configOptions);
    validateResults(analysisResults, 7);
});

test('Private1', () => {
    const configOptions = new ConfigOptions('.');

    // By default, optional diagnostics are ignored.
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['private1.py'], configOptions);
    validateResults(analysisResults, 0);

    // Turn on errors.
    configOptions.diagnosticSettings.reportPrivateUsage = 'error';
    analysisResults = TestUtils.typeAnalyzeSampleFiles(['private1.py'], configOptions);
    validateResults(analysisResults, 3);
});

test('Constant1', () => {
    const configOptions = new ConfigOptions('.');

    // By default, optional diagnostics are ignored.
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['constant1.py'], configOptions);
    validateResults(analysisResults, 0);

    // Turn on errors.
    configOptions.diagnosticSettings.reportConstantRedefinition = 'error';
    analysisResults = TestUtils.typeAnalyzeSampleFiles(['constant1.py'], configOptions);
    validateResults(analysisResults, 5);
});

test('Tuples1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['tuples1.py']);

    validateResults(analysisResults, 4);
});

test('NamedTuples1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['namedTuples1.py']);

    validateResults(analysisResults, 6);
});

test('DataClass1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['dataclass1.py']);

    validateResults(analysisResults, 0);
});

test('DataClass2', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['dataclass2.py']);

    validateResults(analysisResults, 1);
});

test('DataClass3', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['dataclass3.py']);

    validateResults(analysisResults, 1);
});

test('DataClass4', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['dataclass4.py']);

    validateResults(analysisResults, 6);
});

test('AbstractClass1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['abstractClass1.py']);

    validateResults(analysisResults, 2);
});

test('Module1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['module1.py']);

    validateResults(analysisResults, 0);
});

test('Ellipsis1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['ellipsis1.pyi']);

    validateResults(analysisResults, 10);
});

test('Generators1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['generators1.py']);

    validateResults(analysisResults, 5);
});

test('Generators2', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['generators2.py']);

    validateResults(analysisResults, 2);
});

test('Generators3', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['generators3.py']);

    validateResults(analysisResults, 1);
});

test('Coroutines1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['coroutines1.py']);

    validateResults(analysisResults, 3);
});

test('Loops1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['loops1.py']);

    validateResults(analysisResults, 2);
});

test('Constants1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['constants1.py']);

    validateResults(analysisResults, 20);
});

test('NoReturn1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['noreturn1.py']);

    validateResults(analysisResults, 3);
});

test('With1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['with1.py']);

    validateResults(analysisResults, 2);
});

test('ForLoops1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['forLoops1.py']);

    validateResults(analysisResults, 2);
});

test('ListComprehension1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['listComprehension1.py']);

    validateResults(analysisResults, 1);
});

test('Literals1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['literals1.py']);

    validateResults(analysisResults, 6);
});

test('TypeAlias1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['typeAlias1.py']);

    validateResults(analysisResults, 0);
});

test('Dictionary1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['dictionary1.py']);

    validateResults(analysisResults, 2);
});

test('Classes1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['classes1.py']);

    validateResults(analysisResults, 1);
});

test('Enums1', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['enums1.py']);

    validateResults(analysisResults, 3);
});

test('Enums2', () => {
    let analysisResults = TestUtils.typeAnalyzeSampleFiles(['enums2.py']);

    validateResults(analysisResults, 0);
});
