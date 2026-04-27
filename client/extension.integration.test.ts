import * as assert from 'assert';
import { suite, test } from 'mocha';
import * as extension from '../extension';

suite('Extension Unit Test Suite', () => {
  test('deactivate should execute without throwing', () => {
    assert.doesNotThrow(() => extension.deactivate());
  });

  test('activate should throw if dsrv-lsp binary is missing', () => {
    // Create a mock ExtensionContext that returns a guaranteed non-existent path
    // This makes the real fs.existsSync naturally return false.
    const mockContext: any = {
      subscriptions: [],
      asAbsolutePath: (p: string) => `/path/that/definitely/does/not/exist/${p}`
    };

    assert.throws(() => {
      extension.activate(mockContext);
    }, /Could not find dsrv-lsp/);
  });
});