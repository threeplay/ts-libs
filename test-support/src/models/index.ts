import exp from "constants";
import {isModuleNamespaceObject} from "util/types";
import Spec = Mocha.reporters.Spec;
import {emitKeypressEvents} from "readline";
import {Random} from "../utils";

export type ModelSpecKeys = '$mid' | '$generator';

export interface ModelSpec {
    /// Model id to identify the model instance when instantiated
    $mid?: string;

    /// Model generator to use. If not defined, select a generator based on model path
    $generator?: string;
}

export type ModelFromSpec<Spec extends ModelSpec> = { [K in keyof Omit<Spec, ModelSpecKeys>]: Spec[K] };

type KeysOfNullableFields<T> = { [K in keyof T]-?: T[K] extends null ? K : never }[keyof T];
type OptionalNullableFields<T> = Omit<T, KeysOfNullableFields<T>> & Partial<Pick<T, KeysOfNullableFields<T>>>;

export interface GeneratorContext {
    generateNamed(name: string): SpecFieldBuilder<unknown> | undefined;
}

export type SpecFieldBuilder<T> = (context?: GeneratorContext) => T
export type SpecBuilder<Spec> =
    Spec extends SpecFieldBuilder<infer BuildType>
        ? SpecBuilder<BuildType>
        : Spec extends Array<infer T>
            ? SpecBuilder<T>[]
            : Spec extends Record<any, any>
                ? { [K in keyof Omit<Spec, ModelSpecKeys>]?: SpecBuilder<Spec[K]> }
                :  Spec extends Date | string | number | null
                    ? Spec | undefined | SpecFieldBuilder<Spec>
                    : never;

export type ModelFromBuilder<SpecBuilder> =
    SpecBuilder extends SpecFieldBuilder<infer BuildType>
        ? ModelFromBuilder<BuildType>
        : SpecBuilder extends Array<infer T>
            ? ModelFromBuilder<T>[]
            : SpecBuilder extends Record<any, any>
                ? { [K in keyof Omit<SpecBuilder, ModelSpecKeys>]: ModelFromBuilder<SpecBuilder[K]> }
                : SpecBuilder extends null
                    ? SpecBuilder | undefined
                    : SpecBuilder extends Date | string | number
                        ? SpecBuilder
                        : never


export abstract class FieldBuilder {
    public static string(options?: { oneOf?: string[], generator?: string }): SpecFieldBuilder<string> {
        return (context?: GeneratorContext) => {
            if (options?.generator) {
                const generator = context?.generateNamed(options.generator);
                if (generator) {
                    return generator(context) as string;
                }
            }

            if (options?.oneOf) {
                return Random.ensurePick(options.oneOf);
            }

            return '';
        }
    }

    public static optionalString(options?: { oneOf?: string[], generator?: string }): SpecFieldBuilder<string | null> {
        return this.string(options);
    }

    public static number(options?: { min?: number; max?: number }): SpecFieldBuilder<number> {
        return () => Random.inRange(options?.max ?? 100, options?.min ?? 0);
    }
}

/*

 Create generators based on source type. The source type converts all fields to be non-optional. The return type of the methods will match the type
 Generator methods can be inserted or added fixed. This generator will generate new objects as needed. It can have methods refering to other fields
 by path and even cascades incase a path doesn't exist.

 Final spec will be combination of these generators. Override spec will be an optional source with the same layout.

 When creating a model builder it will accept this default specs as its input and overrides can be added later.

 Custom data creators that can take the generated spec and generate the required low level data to match the spec.
 This can be injected later and can be very specific for a spec or can have some resolution rules based on path


 */


export interface ModelBuilderAccessor {
    valueOf<T>(fieldPath: string): T;
}

export interface ModelGenerator {
    generate<T>(builderAccessor: ModelBuilderAccessor, objectPath: string): T;
}

class GeneratorRegistry {
    private readonly generators = new Map<string, ModelGenerator>();
    private readonly index = new Map<string, string>();

    public addGenerator(name: string, matchPaths: string[], generator: ModelGenerator) {
        this.generators.set(name, generator);
        matchPaths.forEach(path => this.index.set(path, name));
    }

    public generatorMatching(path: string): ModelGenerator | null {
        const name = this.index.get(path) ?? path;
        return this.generators.get(name) ?? null;
    }
}

export class ModelGeneratorContext implements GeneratorContext {
    public generateNamed(name: string): SpecFieldBuilder<unknown> | undefined {
        if (name === 'uuid') {
            return () => 'xx-yy';
        }
        if (name === 'first-name') {
            return () => Random.ensurePick(['joe', 'robert', 'sarah', 'ian', 'adrian', 'caroline', 'nicola', 'paul'])
        }
        if (name === 'last-name') {
            return () => Random.ensurePick(['clark', 'robertson', 'slater', 'morrison', 'langdon', 'smith', 'miller', 'north', 'arnold', 'kerr']);
        }
        return undefined;
    }
}

export class ModelBuilder<Model> {
    public static withSpec<SpecBuilder>(spec: SpecBuilder): ModelBuilder<ModelFromBuilder<SpecBuilder>> {
        return new ModelBuilder(spec as any) as ModelBuilder<ModelFromBuilder<SpecBuilder>>;
    }

    public readonly registry = new GeneratorRegistry();

    constructor(private readonly spec: SpecBuilder<Model>) {
        // allKeyPaths(spec);

    }
    private builtModels = new Map<string, unknown>();

    /*
        build(): Creates in-memory generation of all objects based on their rules/random and dependencies

        The model builds has two modes as in-memory generator and interface to model specific storage


        getOrCreate(): return a materialized object of the object (saved into datastore)
        update(): updates a specific model (using path or short-path)
        delete(): deletes a model (will include object depends on it if the backend generator knows how to get this info)
     */

    public build(): Model {
        const objects = this.buildObjects(new ModelGeneratorContext(), this.spec as any)
        if (objects.length !== 1) {
            throw Error(`Generator returned unexpected number of objects [${objects.length}]`);
        }
        return objects[0] as Model;
    }

    private buildObjects(context: ModelGeneratorContext, object: Record<string, unknown>, parentPrefix?: string): unknown[] {
        const buildSingle = () => {
            const builtObject: { [K: string]: unknown } = {};
            objectWalk(object, (path, key, field) => {
                console.log(`Path: ${path}`);
                if (field instanceof Function) {
                    const value = field(context);
                    if (typeof value !== 'undefined') {
                        builtObject[key] = value;
                    }
                } else if (Array.isArray(field)) {
                    // Process array ourselves. Nested arrays are not supported
                    // Each array element is processed and the resulted items are added as an array
                    const elements: unknown[] = [];
                    field.forEach(entry => {
                        if (Array.isArray(entry)) {
                            throw Error(`nested arrays are not supported`);
                        }
                        if (typeof entry === 'object') {
                            elements.push(...this.buildObjects(context, entry, `${path}[${elements.length}]`));
                        }
                    });

                    builtObject[key] = elements;
                    return {walk: false}
                } else if (field && typeof field === 'object') {
                    const result = this.buildObjects(context, field as any, path);
                    if (result.length > 1) {
                        throw Error(`Unexpected objects count ${result.length} at ${path}`);
                    }
                    builtObject[key] = result;
                } else {
                    builtObject[key] = field;
                }

                // const generator = this.registry.generatorMatching(path);
                // if (generator) {
                //     const generatedFields = generator.generate({} as ModelBuilderAccessor, path);
                //     if (Array.isArray(field)) {
                //         // For each array element, apply the generated fields. If the element has $count, generate copies
                //         // Once we are done we should have a generated template which should be ready to materialize with values
                //
                //     }
                // }

                return {walk: false};
            }, parentPrefix ?? '');
            return builtObject;
        }

        const builtObjects: unknown[] = [];
        const objectCount = typeof object.$count === 'number' ? object.$count : 1;
        for (let i = 0; i < objectCount; ++i) {
            builtObjects.push(buildSingle());
        }
        return builtObjects;
    }
}

function objectWalk(object: Record<string, unknown>, onField: (path: string, key: string, field: unknown) => {  walk: boolean }, parentPrefix: string = '') {
    Object.keys(object).forEach(key => {
        if (!key.startsWith('$')) {
            const field = object[key];
            const path = parentPrefix ? `${parentPrefix}.${key}` : key;
            if (onField(path, key, field).walk) {
                if (Array.isArray(field)) {
                    arrayWalk(field as any, onField, path);
                } else if (field && typeof field === 'object') {
                    objectWalk(field as any, onField, path);
                }
            }
        }
    });
}

function arrayWalk(array: unknown[], onEntry: (path: string, key: string, field: unknown) => {  walk: boolean }, parentPrefix: string = '') {
    array.forEach((entry, idx) => {
        const entryPath = `${parentPrefix}[${idx}]`;
        if (onEntry(entryPath, idx.toString(), entry).walk) {
            if (Array.isArray(entry)) {
                arrayWalk(entry, onEntry, entryPath);
            } else if (entry && typeof entry === 'object') {
                objectWalk(entry as any, onEntry, entryPath);
            }
        }
    });
}

//
// function allKeyPaths(spec: Record<string, any>, prefix?: string): string[] {
//     const keyPaths: string[] = [];
//     Object.keys(spec).forEach(key => {
//         if (!key.startsWith('$')) {
//             const field = spec[key];
//             if (Array.isArray(field)) {
//                 field.forEach((element, i) => {
//
//                 });
//             } else if (field && typeof field === 'object') {
//                 keyPaths.push(...allKeyPaths(field, `${prefix ? `${prefix}.` : ''}${key}`));
//             } else {
//
//             }
//         }
//     })
// }
