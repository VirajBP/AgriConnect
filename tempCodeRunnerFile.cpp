include <iostream>
include <cmath>
using namespace std;

typedef long long ll;

ll exponentiate(ll base, ll exp, ll mod) {
    ll result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) result = (result * base) % mod;
        base = (base * base) % mod;
        exp /= 2;
    }
    return result;
}

ll mod_inv(ll public_exp, ll totient) {
    for (ll private_exp = 2; private_exp < totient; ++private_exp) {
        if ((public_exp * private_exp) % totient == 1) return private_exp;
    }
    return -1;
}

ll compute_gcd(ll num1, ll num2) {
    while (num2) {
        ll temp = num2;
        num2 = num1 % num2;
        num1 = temp;
    }
    return num1;
}

void generate_rsa_keys(ll &pub_key, ll &priv_key, ll &mod) {
    ll prime1 = 7919, prime2 = 1009;
    mod = prime1 * prime2;
    ll totient = (prime1 - 1) * (prime2 - 1);
    
    for (pub_key = 2; pub_key < totient; ++pub_key) {
        if (compute_gcd(pub_key, totient) == 1) break;
    }
    priv_key = mod_inv(pub_key, totient);
}

ll rsa_encrypt(ll plaintext, ll pub_key, ll mod) {
    return exponentiate(plaintext, pub_key, mod);
}

ll rsa_decrypt(ll ciphertext, ll priv_key, ll mod) {
    return exponentiate(ciphertext, priv_key, mod);
}

int main() {
    cout << "\nRSA Encryption-Decryption\n";
    ll pub_key, priv_key, mod;
    generate_rsa_keys(pub_key, priv_key, mod);
    cout << "Public Key: (" << pub_key << ", " << mod << ")\n";
    cout << "Private Key: (" << priv_key << ", " << mod << ")\n";

    cout << "\nExample: Integer Encryption\n";
    ll num;
    cout << "Enter a number: ";
    cin >> num;
    cout << "Original Number: " << num << "\n";
    
    ll cipher_text = rsa_encrypt(num, pub_key, mod);
    cout << "Encrypted Data: " << cipher_text << "\n";
    
    ll original_num = rsa_decrypt(cipher_text, priv_key, mod);
    cout << "Decrypted Number: " << original_num << "\n";

    cout << "\nExample: Character Encryption\n";
    char ch;
    cout << "Enter a character: ";
    cin >> ch;
    cout << "Original Character: " << ch << "\n";
    ll num_equivalent = static_cast<ll>(ch);
    cout << "Numeric Equivalent: " << num_equivalent << "\n";
    
    ll cipher_char = rsa_encrypt(num_equivalent, pub_key, mod);
    cout << "Encrypted Data: " << cipher_char << "\n";
    
    ll decrypted_char = rsa_decrypt(cipher_char, priv_key, mod);
    cout << "Decrypted Numeric: " << decrypted_char << "\n";
    cout << "Decrypted Character: " << static_cast<char>(decrypted_char) << "\n";
    
    return 0;
}
