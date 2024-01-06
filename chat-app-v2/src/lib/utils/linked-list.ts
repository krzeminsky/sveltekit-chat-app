export class LinkedList<T> {
    first?: ListNode<T>;
    last?: ListNode<T>;
    
    count = 0;

    toArray() {
        const res = new Array<T>(this.count);
        
        let i = 0;
        let current = this.first;

        while (current) {
            res[i] = current.value;
            current = current.next;
            i++;
        }

        return res;
    }

    toReversedArray() {
        const res = new Array<T>(this.count);

        let i = res.length - 1;
        let current = this.first;

        while (current) {
            res[i] = current.value;
            current = current.next;
            i--;
        }

        return res;
    }

    insert(value: T) {
        const node = new ListNode(value, this.first);
        
        if (!this.first) {
            this.first = node;
            this.last = node;
        } else {
            this.first = node;
        }

        this.count++;
    }

    push(value: T) {
        const node = new ListNode(value);

        if (!this.last) {
            this.first = node;
            this.last = node;
        } else if (this.last == this.first) {
            this.first.next = node;
            this.last = node;
        } else {
            this.last.next = node;
            this.last = node;
        }

        this.count++;
    }

    firstMatch(predicate: (item: T) => boolean) {
        let current = this.first;
        while (current) {
            if (predicate(current.value)) return current.value;
        }
    }

    delete(item: T) {
        let current = this.first;
        let previous: ListNode<T>|undefined;

        while (current) {
            if (item == current.value) {
                if (previous) {
                    previous.next = current.next;
                }

                if (this.first == current) {
                    if (this.count == 1) this.last = undefined; // ? this.first == this.last
                    
                    this.first = current.next; 
                } else if (this.last == current) {
                    this.last = undefined;
                }

                this.count--;
                
                break;
            }

            previous = current;
            current = current.next;
        }
    }

    deleteFirstMatch(predicate: (item: T) => boolean) {
        let current = this.first;
        let previous: ListNode<T>|undefined;

        while (current) {
            if (predicate(current.value)) {
                if (previous) {
                    previous.next = current.next;
                }

                if (this.first == current) {
                    if (this.count == 1) this.last = undefined; // ? this.first == this.last
                    
                    this.first = current.next; 
                } else if (this.last == current) {
                    this.last = undefined;
                }

                this.count--;
                
                break;
            }

            previous = current;
            current = current.next;
        }
    }
}

class ListNode<T> {
    next?: ListNode<T>;
    value: T;

    constructor(value: T, next?: ListNode<T>) {
        this.value = value;
        this.next = next;
    }
}