import {FieldBuilder, ModelBuilder, ModelFromBuilder, ModelFromSpec, ModelSpec, SpecBuilder} from "./index";

const User = {
    id: FieldBuilder.string({ generator: 'uuid' }),
    firstName: FieldBuilder.string({ generator: 'first-name' }),
    lastName: FieldBuilder.string({ generator: 'last-name' }),
    email: FieldBuilder.string({ generator: 'email' }),
};

const ScheduleEvent = {
    id: FieldBuilder.string({ generator: 'uuid' }),
    time: FieldBuilder.string({ generator: 'iso-date' }),
};

const Player = {
    id: FieldBuilder.string({ generator: 'uuid' }),
    teamId: FieldBuilder.string({ generator: 'uuid' }),
    firstName: FieldBuilder.string({ generator: 'first-name' }),
    lastName: FieldBuilder.string({ generator: 'last-name' }),
};

const Opponent = {
    id: FieldBuilder.string({ generator: 'uuid' }),
    ownerId: FieldBuilder.string({ generator: 'uuid' }),
    name: FieldBuilder.string({ generator: 'team-name' }),
    players: [Player],
};

const Team = {
    id: FieldBuilder.string({ generator: 'uuid' }),
    name: FieldBuilder.optionalString({ generator: 'team-name' }),
    sport: FieldBuilder.string({ generator: 'sport' }),
    ownerUserId: FieldBuilder.string({ generator: 'uuid' }),
    opponentTeams: [Opponent],
    scheduleEvents: [ScheduleEvent],
    roster: [Player],
};

const System = {
    name: 'test',
    z: null,
    x: FieldBuilder.number(),
    users: [{ ...User, $count: 10 }],
    teams: [Team],
}

// type ToSpec<T> = SpecBuilder<T>;

// type SystemType = ToSpec<typeof System>

function generate<Spec>(spec: Spec): ModelFromBuilder<Spec> {
    return ModelBuilder.withSpec(spec).build();
}

// interface GCSystem extends ModelSpec {
//     users: GCUser[];
//     teams: GCTeam[];
//     organizations: GCOrg[];
// }
//
// interface GCUser extends ModelSpec {
//     id: string;
//     email: string;
//     first_name: string;
//     last_name: string;
// }
//
// interface GCTeam extends ModelSpec {
//     id: string;
//     name: string;
//     sport: string;
//     ownerUserId: string;
//     opponentTeams: GCOpponent[];
//     scheduleEvents: GCScheduleEvent[];
//     roster: GCPlayer[];
// }
//
// interface GCOpponent extends ModelSpec {
//     id: string;
//     ownerId: string;
//     name: string;
//     players: GCPlayer[];
// }
//
// interface GCPlayer extends ModelSpec {
//     id: string;
//     team_id: string;
//     first_name: string;
//     last_name: string;
// }
//
// interface GCScheduleEvent extends ModelSpec {
//     id: string;
//     time: string;
// }
//
// interface GCOrg extends ModelSpec {
//     teams: string[];
// }
//
// interface TestModelSpec extends ModelSpec {
//     field: string;
//     other: number;
//     list: {
//         x: string;
//     }[];
//     sub: {
//         inner: string;
//         list: {
//             y: number;
//         }[];
//     }
// }
//
// type test = SpecBuilder<GCSystem>;
//

interface SpecPath {
    id?: string;
    path: string;
    type: 'object' | 'field';
    // generator: (id, path) => value
}

function keyPaths(specPath: SpecPath[], value: unknown, prefix: string = '') {
    if (Array.isArray(value)) {
        specPath.push({ type: 'field', path: prefix });
        value.forEach((element, idx) => {
            keyPaths(specPath, element, `${prefix}[${idx}]`);
        });
    } else if (value && typeof value === 'object') {
        const id = '$mid' in value && typeof (value as any).$mid === 'string' ? (value as any).$mid : undefined;
        specPath.push({ type: 'object', id: id ?? prefix, path: prefix });
        Object.keys(value).forEach(key => {
            if (!key.startsWith('$')) {
                keyPaths(specPath, (value as any)[key as string], prefix.length > 0 ? `${prefix}.${key}` : key);
            }
        });
    } else {
        specPath.push({ type: 'field', path: prefix });
    }
}

// describe('Key Paths', () => {
//     it('should create spec mapping for model', async () => {
//         const path: SpecPath[] = [];
//         keyPaths(path, {
//             field: 'x',
//             other: 1,
//             inner: {
//                 $mid: 'my-data',
//                 test: 5,
//                 sub: {
//                     x: 1
//                 }
//             },
//             list: [{ $mid: 'first-entry', one: 1 }, { two: 2 }, { three: { four: 4 } }],
//         })
//         expect(path).to.deep.equal([]);
//     });
// });

describe('Model Builder', () => {
    it('test', async () => {
        const result = generate(System);
        console.log(`Result build`, result);
    });

    // it('test', async () => {
    //     const sut = ModelBuilder.withSpec<GCSystem>({
    //         users: [{ $mid: 'my-user' }],
    //         teams: [{
    //             $mid: 'my-team',
    //             ownerUserId: 'my-user',
    //             sport: FieldBuilder.string({ oneOf: ['baseball', 'basketball' ]}),
    //             opponentTeams: [
    //                 { $mid: 'opponent' }
    //             ],
    //             roster: [
    //                 { $mid: 'player-1', first_name: FieldBuilder.string() }
    //             ],
    //             scheduleEvents: [
    //                 { $mid: 'game-1' }
    //             ]
    //         }],
    //         organizations: [{ teams: ['my-team']}],
    //     });
    //
    //     sut.registry.addGenerator('user', ['users'], {} as any);
    //     sut.registry.addGenerator('team', ['teams'], {} as any);
    //     sut.registry.addGenerator('player', ['roster', 'players'], {} as any);
    //
    //     sut.build();
    // });

    // it('should create instance', async () => {
    //     const sut = ModelBuilder.withSpec<TestModelSpec>({
    //         field: FieldBuilder.string(),
    //         list: [{ x: FieldBuilder.string() }],
    //     });
    //
    // });
});

/*

  Build process:
    1. Get generators for all key paths (generators are either constant values, or functions)
    2. From the model's root, each field is called to the generator for that field.
    3. If a field is an object or an array. Recursivley generate the objects.
        Array can generate 0-n entries per record if uses $count
    4. If generator is requesting a field that has not generated yet, we try to generate it at that point protecting against circular requests

    Each object will b

 */
